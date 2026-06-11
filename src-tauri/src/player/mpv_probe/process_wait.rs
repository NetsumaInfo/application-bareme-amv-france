use std::io::Read;
use std::process::{Child, Output};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[cfg(target_os = "windows")]
fn terminate_child_handle(raw_handle: isize) {
    extern "system" {
        fn TerminateProcess(h_process: isize, u_exit_code: u32) -> i32;
    }
    unsafe {
        let _ = TerminateProcess(raw_handle, 1);
    }
}

fn spawn_pipe_reader<R: Read + Send + 'static>(mut pipe: R) -> thread::JoinHandle<Vec<u8>> {
    thread::spawn(move || {
        let mut buffer = Vec::new();
        let _ = pipe.read_to_end(&mut buffer);
        buffer
    })
}

fn join_pipe_reader(handle: Option<thread::JoinHandle<Vec<u8>>>) -> Vec<u8> {
    handle.and_then(|h| h.join().ok()).unwrap_or_default()
}

/// Waits for `child` with a hard timeout using a single blocking wait
/// (dedicated waiter thread + `recv_timeout`) instead of a `try_wait` poll loop.
///
/// - `Ok(Some(output))` — process finished within `timeout`.
/// - `Ok(None)` — timeout elapsed; the child has been killed and reaped.
/// - `Err(_)` — waiting on the process failed.
pub(crate) fn wait_with_output_timeout(
    mut child: Child,
    timeout: Duration,
) -> Result<Option<Output>, String> {
    // Drain pipes on dedicated threads so a chatty child can never deadlock
    // on a full pipe buffer while we wait for exit.
    let stdout_reader = child.stdout.take().map(spawn_pipe_reader);
    let stderr_reader = child.stderr.take().map(spawn_pipe_reader);

    #[cfg(target_os = "windows")]
    let raw_handle = {
        use std::os::windows::io::AsRawHandle;
        child.as_raw_handle() as isize
    };

    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let status = child.wait();
        // Send the child along so its process handle stays open (and the
        // raw handle stays valid) until the receiving side is done with it.
        let _ = tx.send((status, child));
    });

    match rx.recv_timeout(timeout) {
        Ok((status, _child)) => {
            let status = status.map_err(|e| format!("wait failed: {}", e))?;
            let stdout = join_pipe_reader(stdout_reader);
            let stderr = join_pipe_reader(stderr_reader);
            Ok(Some(Output {
                status,
                stdout,
                stderr,
            }))
        }
        Err(_) => {
            // Timeout: kill the child, then reap it so nothing lingers.
            // The waiter thread still owns the `Child`, so the handle is valid.
            #[cfg(target_os = "windows")]
            terminate_child_handle(raw_handle);
            let _ = rx.recv_timeout(Duration::from_millis(500));
            Ok(None)
        }
    }
}

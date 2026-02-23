use serde_json::Value;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

pub fn run_ffprobe(path: &str) -> Result<Value, String> {
    let mut command = Command::new(crate::player::commands::resolve_tool("ffprobe.exe"));
    crate::player::commands::configure_hidden_process(&mut command);
    let mut child = command
        .args([
            "-v",
            "error",
            "-show_streams",
            "-show_format",
            "-of",
            "json",
            path,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("ffprobe indisponible: {}", e))?;

    let timeout = Duration::from_secs(4);
    let start = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err("ffprobe timeout (4s)".to_string());
                }
                thread::sleep(Duration::from_millis(20));
            }
            Err(e) => {
                return Err(format!("ffprobe wait failed: {}", e));
            }
        }
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("ffprobe output failed: {}", e))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    serde_json::from_slice(&output.stdout).map_err(|e| format!("ffprobe JSON invalide: {}", e))
}

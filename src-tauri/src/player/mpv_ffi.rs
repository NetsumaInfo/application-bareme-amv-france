#![allow(dead_code)]
use libloading::Library;
use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_double, c_int, c_void};
use std::ptr;

// mpv format constants
pub const MPV_FORMAT_NONE: c_int = 0;
pub const MPV_FORMAT_STRING: c_int = 1;
pub const MPV_FORMAT_FLAG: c_int = 3;
pub const MPV_FORMAT_INT64: c_int = 4;
pub const MPV_FORMAT_DOUBLE: c_int = 5;

// mpv event IDs
pub const MPV_EVENT_NONE: c_int = 0;
pub const MPV_EVENT_SHUTDOWN: c_int = 1;
pub const MPV_EVENT_FILE_LOADED: c_int = 8;
pub const MPV_EVENT_PROPERTY_CHANGE: c_int = 22;

#[repr(C)]
pub struct MpvEvent {
    pub event_id: c_int,
    pub error: c_int,
    pub reply_userdata: u64,
    pub data: *mut c_void,
}

#[repr(C)]
pub struct MpvEventProperty {
    pub name: *const c_char,
    pub format: c_int,
    pub data: *mut c_void,
}

pub type MpvHandle = *mut c_void;

pub struct MpvLib {
    _lib: Library,
    pub create: unsafe fn() -> MpvHandle,
    pub initialize: unsafe fn(MpvHandle) -> c_int,
    pub terminate_destroy: unsafe fn(MpvHandle),
    pub command: unsafe fn(MpvHandle, *const *const c_char) -> c_int,
    pub command_string: unsafe fn(MpvHandle, *const c_char) -> c_int,
    pub set_option_string: unsafe fn(MpvHandle, *const c_char, *const c_char) -> c_int,
    pub get_property_string: unsafe fn(MpvHandle, *const c_char) -> *mut c_char,
    pub set_property_string: unsafe fn(MpvHandle, *const c_char, *const c_char) -> c_int,
    pub set_property: unsafe fn(MpvHandle, *const c_char, c_int, *mut c_void) -> c_int,
    pub get_property: unsafe fn(MpvHandle, *const c_char, c_int, *mut c_void) -> c_int,
    pub observe_property: unsafe fn(MpvHandle, u64, *const c_char, c_int) -> c_int,
    pub wait_event: unsafe fn(MpvHandle, c_double) -> *mut MpvEvent,
    pub free: unsafe fn(*mut c_void),
}

impl MpvLib {
    pub fn load() -> Result<Self, String> {
        // Try multiple possible locations for mpv DLL
        let lib_names = vec![
            "mpv-2.dll",
            "libmpv-2.dll",
            "mpv-1.dll",
        ];

        let mut last_error = String::new();

        for name in &lib_names {
            match unsafe { Library::new(name) } {
                Ok(lib) => {
                    return Self::load_from_library(lib);
                }
                Err(e) => {
                    last_error = format!("Failed to load {}: {}", name, e);
                }
            }
        }

        // Try from resources directory
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                for name in &lib_names {
                    let full_path = exe_dir.join("resources").join("windows").join(name);
                    if full_path.exists() {
                        match unsafe { Library::new(full_path) } {
                            Ok(lib) => return Self::load_from_library(lib),
                            Err(e) => {
                                last_error = format!("Failed to load from resources: {}", e);
                            }
                        }
                    }
                    // Also try directly in exe dir
                    let full_path = exe_dir.join(name);
                    if full_path.exists() {
                        match unsafe { Library::new(full_path) } {
                            Ok(lib) => return Self::load_from_library(lib),
                            Err(e) => {
                                last_error = format!("Failed to load from exe dir: {}", e);
                            }
                        }
                    }
                }
            }
        }

        Err(format!(
            "mpv library not found. Please install mpv or place mpv-2.dll in the application directory. Last error: {}",
            last_error
        ))
    }

    fn load_from_library(lib: Library) -> Result<Self, String> {
        unsafe {
            // Extract raw function pointers before moving lib
            let create_ptr = *lib
                .get::<unsafe fn() -> MpvHandle>(b"mpv_create\0")
                .map_err(|e| format!("Failed to load mpv_create: {}", e))?;
            let initialize_ptr = *lib
                .get::<unsafe fn(MpvHandle) -> c_int>(b"mpv_initialize\0")
                .map_err(|e| format!("Failed to load mpv_initialize: {}", e))?;
            let terminate_destroy_ptr = *lib
                .get::<unsafe fn(MpvHandle)>(b"mpv_terminate_destroy\0")
                .map_err(|e| format!("Failed to load mpv_terminate_destroy: {}", e))?;
            let command_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const *const c_char) -> c_int>(b"mpv_command\0")
                .map_err(|e| format!("Failed to load mpv_command: {}", e))?;
            let command_string_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const c_char) -> c_int>(b"mpv_command_string\0")
                .map_err(|e| format!("Failed to load mpv_command_string: {}", e))?;
            let set_option_string_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const c_char, *const c_char) -> c_int>(
                    b"mpv_set_option_string\0",
                )
                .map_err(|e| format!("Failed to load mpv_set_option_string: {}", e))?;
            let get_property_string_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const c_char) -> *mut c_char>(
                    b"mpv_get_property_string\0",
                )
                .map_err(|e| format!("Failed to load mpv_get_property_string: {}", e))?;
            let set_property_string_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const c_char, *const c_char) -> c_int>(
                    b"mpv_set_property_string\0",
                )
                .map_err(|e| format!("Failed to load mpv_set_property_string: {}", e))?;
            let set_property_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const c_char, c_int, *mut c_void) -> c_int>(
                    b"mpv_set_property\0",
                )
                .map_err(|e| format!("Failed to load mpv_set_property: {}", e))?;
            let get_property_ptr = *lib
                .get::<unsafe fn(MpvHandle, *const c_char, c_int, *mut c_void) -> c_int>(
                    b"mpv_get_property\0",
                )
                .map_err(|e| format!("Failed to load mpv_get_property: {}", e))?;
            let observe_property_ptr = *lib
                .get::<unsafe fn(MpvHandle, u64, *const c_char, c_int) -> c_int>(
                    b"mpv_observe_property\0",
                )
                .map_err(|e| format!("Failed to load mpv_observe_property: {}", e))?;
            let wait_event_ptr = *lib
                .get::<unsafe fn(MpvHandle, c_double) -> *mut MpvEvent>(b"mpv_wait_event\0")
                .map_err(|e| format!("Failed to load mpv_wait_event: {}", e))?;
            let free_ptr = *lib
                .get::<unsafe fn(*mut c_void)>(b"mpv_free\0")
                .map_err(|e| format!("Failed to load mpv_free: {}", e))?;

            Ok(Self {
                _lib: lib,
                create: create_ptr,
                initialize: initialize_ptr,
                terminate_destroy: terminate_destroy_ptr,
                command: command_ptr,
                command_string: command_string_ptr,
                set_option_string: set_option_string_ptr,
                get_property_string: get_property_string_ptr,
                set_property_string: set_property_string_ptr,
                set_property: set_property_ptr,
                get_property: get_property_ptr,
                observe_property: observe_property_ptr,
                wait_event: wait_event_ptr,
                free: free_ptr,
            })
        }
    }
}

// Helper to convert Rust string to C string
pub fn to_cstring(s: &str) -> CString {
    CString::new(s).unwrap_or_else(|_| CString::new("").unwrap())
}

// Helper to convert C string to Rust string
pub fn from_cstr(ptr: *const c_char) -> String {
    if ptr.is_null() {
        return String::new();
    }
    unsafe { CStr::from_ptr(ptr).to_string_lossy().into_owned() }
}

// Build a null-terminated array of C strings for mpv_command
pub fn build_command_args(args: &[&str]) -> Vec<*const c_char> {
    let cstrings: Vec<CString> = args.iter().map(|s| to_cstring(s)).collect();
    let mut ptrs: Vec<*const c_char> = cstrings.iter().map(|s| s.as_ptr()).collect();
    ptrs.push(ptr::null());
    // We need to keep cstrings alive, so we leak them
    std::mem::forget(cstrings);
    ptrs
}

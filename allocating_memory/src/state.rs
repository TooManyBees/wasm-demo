#[cfg(target_arch = "wasm32")] use alloc::prelude::Box;
#[cfg(target_arch = "wasm32")] use core::mem;
#[cfg(not(target_arch = "wasm32"))] use std::mem;

#[repr(C)]
pub struct State {
    value: i32,
    edit_count: u32,
}

#[no_mangle]
pub extern fn create(value: i32) -> *mut State {
  let state = Box::new(State {
    value,
    edit_count: 0,
  });
  Box::into_raw(state)
}

#[no_mangle]
pub extern fn set(handle: *mut State, value: i32) -> u32 {
let mut state = unsafe { Box::from_raw(handle) };
    state.value = value;
    state.edit_count += 1;
    let count = state.edit_count;
    mem::forget(state);
    count
}

#[no_mangle]
pub extern fn increment(handle: *mut State, offset: i32) -> u32 {
    let mut state = unsafe { Box::from_raw(handle) };
    state.value += offset;
    state.edit_count += 1;
    let count = state.edit_count;
    mem::forget(state);
    count
}

#[no_mangle]
pub extern fn consume(handle: *mut State) -> i32 {
  let state = unsafe { Box::from_raw(handle) };
  state.value
}

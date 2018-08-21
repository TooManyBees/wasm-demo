#![cfg_attr(target_arch = "wasm32", no_std)]
#![cfg_attr(target_arch = "wasm32", feature(alloc, core_intrinsics, panic_implementation, lang_items, alloc_error_handler))]

extern crate wee_alloc;
#[cfg(target_arch = "wasm32")] extern crate alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[cfg(target_arch = "wasm32")]
#[panic_implementation]
#[no_mangle]
pub fn panic(_: &::core::panic::PanicInfo) -> ! {
    unsafe { ::core::intrinsics::abort(); }
}

#[cfg(target_arch = "wasm32")]
#[alloc_error_handler]
#[no_mangle]
pub extern fn oom(_: ::core::alloc::Layout) -> ! {
    unsafe { ::core::intrinsics::abort(); }
}

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

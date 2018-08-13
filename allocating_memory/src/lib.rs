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

#[cfg(target_arch = "wasm32")]
use alloc::prelude::Box;

#[no_mangle]
pub extern fn store_number(number: i32) -> *const i32 {
    let boxed = Box::new(number);
    Box::into_raw(boxed)
}

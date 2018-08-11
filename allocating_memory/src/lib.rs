extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[no_mangle]
pub extern fn store_number(number: i32) -> *const i32 {
    let boxed = Box::new(number);
    Box::into_raw(boxed)
}

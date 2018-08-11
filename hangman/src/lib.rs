extern crate wee_alloc;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use std::{mem, ptr, slice, str};

mod hangman;
use hangman::{Hangman, Status};

extern {
    fn win();
    fn lose();
}

#[no_mangle]
pub extern fn alloc(len: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(len);
    let ptr = buf.as_mut_ptr();
    mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern fn dealloc(ptr: *mut u8, len: usize) {
    let _vec = unsafe { Vec::from_raw_parts(ptr, len, len) };
}

#[no_mangle]
pub extern fn dealloc_string(ptr: *mut u8, len: usize) {
    let _str = unsafe { String::from_raw_parts(ptr, len, len) };
}

#[no_mangle]
pub extern fn init(str_ptr: *mut u8, len: usize) -> *mut Hangman {
    if len == 0 {
        return ptr::null_mut();
    }
    let slice = unsafe { slice::from_raw_parts(str_ptr, len) };
    if let Ok(phrase) = str::from_utf8(slice) {
        let hangman = Hangman::new(phrase);
        let boxed = Box::new(hangman);
        Box::into_raw(boxed)
    } else {
        ptr::null_mut()
    }
}

#[no_mangle]
pub extern fn guesses_remaining(ptr: *mut Hangman) -> u8 {
    let hangman = unsafe { Box::from_raw(ptr) };
    let val = hangman.guesses_remaining();
    mem::forget(hangman);
    val
}

#[no_mangle]
pub extern fn guess(ptr: *mut Hangman, str_ptr: *mut u8, len: usize) -> bool {
    if len == 0 {
        return false;
    }
    let mut hangman = unsafe { Box::from_raw(ptr) };
    let slice = unsafe { slice::from_raw_parts(str_ptr, len) };
    let result = if let Ok(string) = str::from_utf8(slice) {
        // Already asserted that length is > 0 and string is valid utf8
        let c = string.chars().nth(0).unwrap();
        hangman.guess(c)
    } else {
        Status::Invalid
    };
    mem::forget(hangman);
    match result {
        Status::Correct => true,
        Status::Wrong => false,
        Status::Invalid => false,
        Status::Win => {
            unsafe { win(); }
            true
        },
        Status::Lose => {
            unsafe { lose(); }
            false
        }
    }
}

#[no_mangle]
pub extern fn unmasked(ptr: *mut Hangman) -> *const u8 {
    let hangman = unsafe { Box::from_raw(ptr) };
    let mut unmasked = hangman.unmasked();
    mem::forget(hangman);

    // Make our own c-style string instead of using CString
    unmasked.push('\0');
    let string_ptr = unmasked.as_ptr();
    mem::forget(unmasked);
    string_ptr
}

#[no_mangle]
pub extern fn size_of() -> usize {
    mem::size_of::<Hangman>()
}
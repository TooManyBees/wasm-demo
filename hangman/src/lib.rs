use std::{mem, ptr, slice, str};
use std::num::NonZeroU8;
use std::ffi::CString;

extern {
    fn win();
    fn lose();
}

const MAX_GUESSES: u8 = 6;

pub struct Hangman {
    guesses: u8,
    phrase: Vec<char>,
    unmasked: Vec<Option<NonZeroU8>>,
}

impl Hangman {
    fn new(phrase: &str) -> Hangman {
        let vec_phrase: Vec<char> = phrase.chars().collect();
        let vec_unmasked = vec![None; vec_phrase.len()];
        Hangman {
            guesses: 0,
            phrase: vec_phrase,
            unmasked: vec_unmasked,
        }
    }

    fn guess(&mut self, c: char) -> bool {
        if c == '\0' {
            self.guesses += 1;
            return false;
        }
        // Decrement guesses if wrong
        if !self.phrase.contains(&c) {
            self.guesses += 1;
        }
        // Check to see if player lost
        if self.guesses >= MAX_GUESSES {
            unsafe { lose() }
            return false;
        }

        // Find indices of the matching letter
        let mut indices = vec![];
        for (idx, letter) in self.phrase.iter().enumerate() {
            if *letter == c {
                indices.push(idx);
            }
        }
        // Unmask the same indices
        unsafe {
            for idx in indices.into_iter() {
                self.unmasked[idx] = Some(NonZeroU8::new_unchecked(c as u8));
            }
        }
        // Check to see if player won
        if self.unmasked.iter().all(|c| c.is_some()) {
            unsafe { win() }
        }
        return true;
    }
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
pub extern fn dealloc_string(ptr: *mut i8) {
    let _str = unsafe { CString::from_raw(ptr) };
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
    let val = hangman.guesses;
    mem::forget(hangman);
    MAX_GUESSES - val
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
        hangman.guess(c);
        true
    } else {
        false
    };
    mem::forget(hangman);
    result
}

#[no_mangle]
pub extern fn unmasked(ptr: *mut Hangman) -> *const i8 {
    let hangman = unsafe { Box::from_raw(ptr) };
    let unmasked: String = hangman.unmasked.iter().map(|c| {
        if let Some(letter) = c {
            letter.get().into()
        } else {
            ' '
        }
    }).collect();
    mem::forget(hangman);

    let unmasked_cstring = CString::new(unmasked).unwrap();
    let cstring_ptr = unmasked_cstring.as_ptr();
    mem::forget(unmasked_cstring);
    cstring_ptr
}

#[no_mangle]
pub extern fn size_of() -> usize {
    mem::size_of::<Hangman>()
}

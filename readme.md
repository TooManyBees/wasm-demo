# hi

this is about WebAssembly

lots of guides exist that either focus on the "hello world" wasm
program (`x_plus_one.wasm`) or the construction of a fully featured
module with an automagically-written javascript side.

this is specifically about the middle ground between those two poles:
the interface between JS land and Wasm land

# what is wasm

`wasm` is a binary format:

```text
0061 736d 0100 0000 0107 0160 027f 7f01
7f02 0b01 026a 7303 6d65 6d02 0001 0302
0100 070e 010a 6163 6375 6d75 6c61 7465
0000 0a32 0130 0102 7f20 0020 0141 046c
6a21 0202 4003 4020 0020 0246 0d01 2003
2000 2802 006a 2103 2000 4104 6a21 000c
000b 0b20 030b
```

# wat

The text representation is called `wat` (to my eternal delight).

```wasm
(module
  (memory (import "js" "mem") 1)
  (func (export "accumulate") (param $ptr i32) (param $len i32) (result i32)
    (local $end i32)
    (local $sum i32)
    (set_local $end (i32.add (get_local $ptr) (i32.mul (get_local $len) (i32.const 4))))
    (block $break (loop $top
      (br_if $break (i32.eq (get_local $ptr) (get_local $end)))
      (set_local $sum (i32.add (get_local $sum)
                               (i32.load (get_local $ptr))))
        (set_local $ptr (i32.add (get_local $ptr) (i32.const 4)))
        (br $top)
    ))
    (get_local $sum)
  )
)
```

It's a lisp. It's readable, to a limit. This function sums a list
of 32 bit integers. Scaling beyond this by hand is a pain. You even
need to account for i32s being 4 bytes as you increment the pointer
while looping.

Other examples are written in Rust. This is not a talk about Rust.
Too many people already think I work for Mozilla. This is also not
an endorsement of Rust, beyond saying that it has the best wasm
tool chain. The alternative is emscripten which takes 45 minutes
and about 10GB to build. Installing Rust and the wasm32 target is
a fifteen minute job.

# quick summary

It's byte code, it runs in a virtual stack machine, it exposes
an API that the browser and Node can access.

Some use cases of wasm modules:
* expensive computation (think media codecs)
* you just want to write in not-js for a specific thing
* pixel crunching?
    * (unfortunately, `<canvas>` jealously guards its bytes like a dragon)
* like, who cares
    * we're past demanding a use case justification for javascript
    * so let's skip that whole argument for wasm's adoption while we're at it

# what can't wasm do?

* handle exceptions
    * errors stop execution of a fn and raise an exception in JS land
* return anything except numbers to JS land
    * though you can return pointers to something that can be represented as byte arrays
    * which doesn't include JS objects
* reach outside of its address space

Javascript glue code needed for:
* allocation
* re-referencing memory buffer after it grew/moved
* passing strings, arrays

# loading

Here's how you load and instantiate a wasm program, but it won't
work for you the first time.

```javascript
WebAssembly.instantiateStreaming(fetch("url.wasm"), {})
.then(wasm => ...)
```

## Your first hiccup after skimming a "hello world" tutorial

Your browser demands the `Content-Type: application/webassembly` header.
`file://` protocol won't add a content type, and no server currently
maps the `wasm` extension to that without manual config.

Either add the right mime type detection to your webserver or do this:

```javascript
fetch("url.wasm")
.then(response => response.arrayBuffer())
.then(bytes => WebAssembly.instantiate(bytes, {}))
.then(wasm => ...)
```

This blocks validation and instantiation until the whole module is
downloaded, unlike `instantiateStreaming` which begins with the 1st byte.

# "hello wasm!"

The `[hello world program](hello_wasm/hello_wasm.wat)` of WebAssembly
is adding 1 to a number.

```javascript
WebAssembly.instantiateStreaming(fetch("hello_wasm.wasm"), {})
.then(wasm => { window.hello_wasm = wasm.instance.exports; });
```

```javascript
window.hello_wasm.add_one(5)
// => 6
```

Wasm can only represent number types `i32`, `i64`, `f32`, `f64`, so
its exported functions can only accept or return the javascript
`Number` type. Non-numbers will get coerced to zero.

```javascript
window.hello_wasm.add_one("Hi there!")
// => 1
window.hello_wasm.add_one(NaN)
// => 1
```

# importing functions

In `[imported_func.wat](imported_func/imported_func.wat)`, the first
two lines are

```wasm
(func $logTime (import "import" "logTime") (param f64))
(func $getTimestamp (import "import" "getTimestamp") (result f64))
;;                                    ^^^^^^^^^^^^ imported function
;;                           ^^^^^^ module name
```

which declares what imports are required for the Wasm module to be
imported. The string `"import"` directly correlates to the key name
`"import"` in the import object below. *This name is totally arbitrary.*
Some examples use `"import"` or `"js"`, and LLVM picks `"env"` for you.
*You can have multiple top level module names.*

```javascript
importObj = {
    import: {
        getTimestamp: Date.now.bind(date), // `bind` works as expected
        logTime: (value) => console.log(`Elapsed time: ${value} ms`),
    }
};
WebAssembly.instantiateStreaming(
    fetch("imported_func.wasm"),
    importObj,
).then(wasm => { window.imported_func = wasm.instance.exports; });
```

This wasm module exports one function `doWork` that takes a number, and
increments a value that many times, just to spend a noticable amount of
time. It uses the imported functions `getTimestamp` to compute the
amount of time it spent incrementing that variable, and then invokes
`logTime` to `console.log` the number of ms.

```javascript
imported_func.doWork(10);
// Elapsed time: 0ms
imported_func.doWork(10000000);
// Elapsed time: 5ms
```

# memory

WebAssembly has a heap in the form of `WebAssembly.Memory`.
A Wasm program can accept a `Memory` imported from its environment,
or it can create its own and export it for the environment to access.
Or it can create its own memory and keep it to itself!

## importing/exporting

The program `[imported_memory](imported_memory/imported_memory.wat)`
accepts an imported `Memory` object. With is exported function
`double(ptr, len)`, it doubles the `len`-element sub-array of `Uint32`s
starting at address `ptr`.

```javascript
mem = new WebAssembly.Memory({ initial: 1 });
array = new Uint32Array(mem.buffer);
importObj = {
    import: {
        memory: mem
    }
};
WebAssembly.instantiateStreaming(
    fetch("imported_memory.wasm"),
    importObj,
).then(wasm => { window.imported_memory = wasm.instance.exports; });
```

```javascript
const ptr = 5;
const len = 10;
for (n in array.slice(ptr, ptr + len)) {
    array[ptr + parseInt(n)] = parseInt(n);
}
// Uint32Array(10) [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
imported_memory.double(ptr, len);
// Uint32Array(10) [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
```

The program could just have easily defined its memory internally,
the exported it for the Javascript code to work with.

## growing

`[grow_memory](grow_memory/grow_memory.wat)`

```javascript
WebAssembly.instantiateStreaming(fetch("grow_memory.wasm"), {})
.then(wasm => { window.grow_memory = wasm.instance.exports; });
```

WebAssembly memory can grow in pages of 65536 bytes. This program
starts with one page of memory exported. It exports one function
to store a `f64` at address 0, and one function to grow the memory
by one page at a time.

```javascript
// What size is the memory initially? 65536 bytes
grow_memory.memory.buffer.byteLength;

// Store a number at address 0 and confirm it's there
grow_memory.store(0.75);
array = new Float64Array(grow_memory.memory.buffer);

// Grow memory with the exported grow function;
grow_memory.grow();

// What size is the memory now? 131072 bytes
grow_memory.memory.buffer.byteLength;

// But when memory is resized, its buffer is invalidated and a new
// one is created. So `array` points to nothing now.
array.buffer.byteLength === 0;

// We need to recreate it after every grow
array = new Float64Array(grow_memory.memory.buffer);
```

```javascript
// Since the program exports its memory, we can use the Memory object's
// Javascript API to grow it.
grow_memory.memory.grow(1);

// The program specified a maximum of 3 pages. It's now at its max size.
grow_memory.memory.grow(1);
// Uncaught RangeError: WebAssembly.Memory.grow(): maximum memory size exceeded

// Or from the WebAssembly side, failure returns `-1`
grow_memory.grow();
```

# using an allocator

`[allocating_memory](allocating_memory/allocating_memory.wat)`

note that you can pass random numbers as the pointer
increment (pointer+1), then check the value of (pointer)
note that the address of state is larger than the original memory size
    then note that memory size grew
    by 64k, the size of 1 webassembly page
    you can grow memory with memory.prototype.grow; wasm code can grow itself too
    growing beyond its capacity raises an exception in JS land
look at the size of that pointer!
    It's kind of low for a pointer
    But it's also not at zero
    There's state for the allocator taking up space
    Also, LLVM creates the shadow stack
        since wasm can only represent i32/i64/f32/f64, structs
        can't go on the heap. They're reserved their own space
        on the heap

let's return some strings
    c-style with null bytes: return the address it starts at
        you'd use a function or generator to consume the arraybuffer until a null byte
    pass in the starting addr to the wasm function, return the length of the string
        you'd read the arraybuffer from offset to offset+length
    (new TextDecoder("encoding-scheme")).decode(str) // not in Edge though

let's export some memory
    you can pass IN memory
    you can pass IN tables
    multiple modules can SHARE memory/tables
    dynamic linking between modules, in JS

we obviously need glue code to deal with shared memory, tables, and strings

## hangman

hey look it's a hangman game

https://webassembly.studio
https://blog.scottlogic.com/2018/04/26/webassembly-by-hand.html
https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts
https://webassembly.org/docs/semantics/

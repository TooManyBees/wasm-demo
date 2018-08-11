# hi

this is about WebAssembly
specifically the interface between JS land and Wasm land
    the liminal space, for the art students in the crowd

# wat

`wasm` is a binary format. The text representation is called `wat`
(to my eternal delight).

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

It's a lisp. It's readable, but can't really scale beyond something
this sized. You even need to account for i32s being 4 bytes as you
increment the pointer while looping.

Other examples are written in Rust. This is not a talk about Rust.
Too many people already think I work for Mozilla. This is also not
an endorsement of Rust, beyond saying that it has the best wasm
tool chain. The alternative is emscripten which takes 45 minutes
to build and about 10GB.

# loading

`WebAssembly.instantiateStreaming(fetch("url.wasm"), {}).then(wasm => ...)`

## Your first hiccup after skimming a "hello world" tutorial

You need the `Content-Type: application/webassembly` header.
`file://` protocol won't add a content type, and no server currently
maps the `wasm` extension to that without manual config.

When you can't get the right response header:
`fetch("url.wasm").then(response => response.arrayBuffer()).then(bytes => WebAssembly.instantiate(bytes, {})).then(wasm => ...)`

This blocks validation and instantiation until the whole module is
downloaded, unlike `instantiateStreaming` which begins with the 1st byte.

# "hello wasm!"

```javascript
WebAssembly.instantiateStreaming(fetch("hello_wasm.wasm"), {})
.then(wasm => { window.hello_wasm = wasm.instance.exports; });
```

exported wasm functions can take number arguments and return number
values (i32, i64, f32, f64) but nothing else

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
        getTimestamp: () => Date.now(),
        logTime: (value) => console.log(`Elapsed time: ${value} ms`),
        // if we added extra key/value pairs here, they would be ignored
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
// 0ms
imported_func.doWork(10000000);
// 5ms
```

# memory

rust demo with state object
pass pointers back and forth
note the low value of the pointer (address space is small!)

## importing/exporting

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

## growing

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

note that you can pass random numbers as the pointer
increment (pointer+1), then check the value of (pointer)
note that the address of state is larger than the original memory size
    then note that memory size grew
    by 64k, the size of 1 webassembly page
    you can grow memory with memory.prototype.grow; wasm code can grow itself too
    growing beyond its capacity raises an exception in JS land

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

todo: use cases?
    expensive computation
    just want to write in not-js for a specific thing
    canvas? also consider shaders though

what can't wasm do?
    handle exceptions; errors stop execution of a fn and raise an exception in JS land
    return anything except numbers to JS land
        though you can return pointers to something that can be represented as byte arrays
        which doesn't include JS objects
    reach outside of its address space

glue needed for:
    re-referencing memory buffer after it grew/moved
    text passing
    allocation

## hangman

hey look it's a hangman game

https://webassembly.studio
https://blog.scottlogic.com/2018/04/26/webassembly-by-hand.html
https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts
https://webassembly.org/docs/semantics/

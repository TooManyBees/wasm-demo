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

do the hello world from developer.mozilla.org
note about import object names
the top level is arbitrarily named; rust toolchain uses "env", other toolchains use "import", whatever

rust demo with state object
pass pointers back and forth
note the low value of the pointer (address space is small!)
go through the exported functions

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


https://webassembly.studio
https://blog.scottlogic.com/2018/04/26/webassembly-by-hand.html
https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts

class Hangman {
  constructor(string) {
    this.stringEncoder = new TextEncoder('utf-8');
    this.stringDecoder = new TextDecoder('utf-8');
    WebAssembly.instantiateStreaming(fetch("hangman.wasm"), {
      env: {
        win: this.win.bind(this),
        lose: this.lose.bind(this),
      }
    })
    .then(wasm => {
      this.module = wasm.instance.exports;
      const secretPhrase = string.split(/\s+/).join("").toLowerCase();
      const { ptr, len } = this.newString(secretPhrase);
      this.handle = this.module.init(ptr, len);
      console.info(`Initialized game with phrase ${secretPhrase}`);
    });
  }

  guess(char) {
    let { ptr, len } = this.newString(char);
    this.module.guess(this.handle, ptr, len);
  }

  unmasked() {
    let ptr = this.module.unmasked(this.handle);
    return this.readCString(ptr);
  }

  newString(string) {
    const stringBytes = this.stringEncoder.encode(string);
    const len = stringBytes.length;
    const ptr = this.module.alloc(len);
    const memory = new Uint8Array(this.module.memory.buffer);
    for (let i = 0; i < len; i++) {
      memory[ptr + i] = stringBytes[i];
    }
    return { ptr, len };
  }

  readCString(ptr) {
    const memory = new Uint8Array(this.module.memory.buffer, ptr);
    function* getCStringBytes(ptr) {
      let offset = 0;
      while (memory[offset] !== 0) {
        if (memory[offset] === undefined) {
          throw new Error(`String ${ptr} continued into undefined memory at ${ptr+offset}`);
        }
        yield memory[offset];
        offset++;
      }
    }

    let stringBytes = new Uint8Array(getCStringBytes(ptr));
    let string = this.stringDecoder.decode(stringBytes);
    this.module.dealloc_string(ptr);
    return string;
  }

  win() {
    console.log("a winner is you");
  }

  lose() {
    console.log("you have lost and dishonored your ancestors");
  }
}

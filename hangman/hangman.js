class Hangman {
  constructor(string, { win = this.win, lose = this.lose, onload } = {}) {
    this.stringEncoder = new TextEncoder('utf-8');
    this.stringDecoder = new TextDecoder('utf-8');
    WebAssembly.instantiateStreaming(fetch("hangman.wasm"), {
      env: {
        win: win.bind(this),
        lose: lose.bind(this),
      }
    })
    .then(wasm => {
      this.module = wasm.instance.exports;
      const secretPhrase = string.split(/\s+/).join("").toLowerCase();
      const { ptr, len } = this.newString(secretPhrase);
      this.handle = this.module.init(ptr, len);
      this.module.dealloc(ptr, len);
      console.info(`Initialized game with phrase ${secretPhrase}`);
    })
    .then(() => onload(this));
  }

  // The public methods we want to expose

  guess(char) {
    let { ptr, len } = this.newString(char.toLowerCase());
    const res = this.module.guess(this.handle, ptr, len);
    this.module.dealloc(ptr, len);
    return res;
  }

  unmasked() {
    let ptr = this.module.unmasked(this.handle);
    return this.readCString(ptr);
  }

  guessesRemaining() {
    return this.module.guesses_remaining(this.handle);
  }

  // Encode a string in utf-8 bytes, allocate space for it
  // in Wasm memory, then store it in the space provided.
  // Return the address and length.
  newString(string) {
    const stringBytes = this.stringEncoder.encode(string);
    const len = stringBytes.byteLength;
    const ptr = this.module.alloc(len);
    const memory = new Uint8Array(this.module.memory.buffer);
    for (let i = 0; i < len; i++) {
      memory[ptr + i] = stringBytes[i];
    }
    return { ptr, len };
  }

  // Read a null-terminated string from Wasm memory, given
  // a pointer to the start of the string. Deallocates
  // the string when complete.
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
    this.module.dealloc_string(ptr, stringBytes.byteLength + 1);
    return string;
  }

  win() {
    console.log("a winner is you");
  }

  lose() {
    console.log("you have lost and dishonored your ancestors");
  }

  byteView() {
    return new ByteView(this);
  }
}

class ByteView {
  constructor(game) {
    this.game = game;
    this.module = game.module;
    this.cache = {};
  }

  invalidated() {
    return !this.cache.array || !this.cache.array.buffer.byteLength;
  }

  get array() {
    if (!this.cache.array || !this.cache.array.buffer.byteLength) {
      this.cache = {
        array: new Uint8ClampedArray(this.module.memory.buffer),
      };
    }
    return this.cache.array;
  }

  get hangman() {
    if (this.invalidated() || !this.cache.hangman) {
      const hangman = new Uint32Array(this.array.buffer, this.game.handle, this.module.size_of()/4);
      this.cache.hangman = hangman;
    }
    return this.cache.hangman;
  }

  get phrase() {
    if (this.invalidated() || !this.cache.phrase) {
      const hangman = this.hangman;
      this.cache.phrase = new Uint32Array(this.array.buffer, hangman[0], hangman[1]);
    }
    return this.cache.phrase;
  }

  get mask() {
    if (this.invalidated() || !this.cache.mask) {
      const hangman = this.hangman;
      this.cache.mask = new Uint8ClampedArray(this.array.buffer, hangman[3], hangman[4]);
    }
    return this.cache.mask;
  }

  get guessed() {
    if (this.invalidated() || !this.cache.guessed) {
      const hangman = this.hangman;
      this.cache.guessed = new Uint32Array(this.array.buffer, hangman[6], hangman[7]);
    }
    return this.cache.guessed;
  }
}

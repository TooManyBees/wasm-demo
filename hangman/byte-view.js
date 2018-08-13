(function(root) {
  const bytes = document.getElementById("bytes");

  function hoverOverByteArray(e) {
    bytes.setAttribute("hover", e.target.getAttribute("hover"));
  }

  function hoverOverPointers(e) {
    const hover = e.target.getAttribute("hover");
    if (hover) {
      bytes.setAttribute("hover", hover);
    }
  }

  document.getElementById("bytes-hangman").addEventListener("mouseover", hoverOverPointers);
  document.getElementById("bytes-phrase").addEventListener("mouseenter", hoverOverByteArray);
  document.getElementById("bytes-mask").addEventListener("mouseenter", hoverOverByteArray);
  document.getElementById("bytes-guessed").addEventListener("mouseenter", hoverOverByteArray);
  bytes.addEventListener("mouseleave", function() {
    bytes.setAttribute("hover", "");
  });
  // At what point does one say "yeah, I'll use a real declarative
  // frontend library like a normal human would"?
  const Bytes = {
    init(byteView) {
      this.byteView = byteView;
      this.setHangman();
      this.setPhrase();
      this.setMask();
      this.setGuessed();
    },
    setHangman() {
      const bytes = this.byteView.hangman;
      const phrase = document.createElement("span");
      phrase.setAttribute("hover", "phrase");
      phrase.textContent = bytes.slice(0, 3).join(", ");
      const mask = document.createElement("span");
      mask.setAttribute("hover", "mask");
      mask.textContent = bytes.slice(3, 6).join(", ");
      const guessed = document.createElement("span");
      guessed.setAttribute("hover", "guessed");
      guessed.textContent = bytes.slice(6, 9).join(", ");
      const numGuesses = document.createElement("span");
      numGuesses.setAttribute("hover", "num-guesses");
      numGuesses.textContent = bytes[9];
      const bytesNode = document.getElementById("bytes-hangman");
      bytesNode.innerHTML = "";
      bytesNode.appendChild(new Text("["));
      bytesNode.appendChild(phrase);
      bytesNode.appendChild(new Text(", "));
      bytesNode.appendChild(mask);
      bytesNode.appendChild(new Text(", "));
      bytesNode.appendChild(guessed);
      bytesNode.appendChild(new Text(", "));
      bytesNode.appendChild(numGuesses);
      bytesNode.appendChild(new Text("]"));
    },
    setPhrase() {
      const bytes = this.byteView.phrase;
      const byteGroups = [];
      for (var i = 0; i < bytes.length; i += 4) {
        const group = document.createElement("span");
        group.textContent = bytes.slice(i, i+4).join(", ");
        byteGroups.push(group);
      }
      const bytesNode = document.getElementById("bytes-phrase");
      bytesNode.innerHTML = "";
      bytesNode.appendChild(new Text("["));
      for (group of byteGroups) {
        bytesNode.appendChild(group);
        bytesNode.appendChild(new Text(", "));
      }
      bytesNode.replaceChild(new Text("]"), bytesNode.childNodes[bytesNode.childNodes.length-1]);
    },
    setMask() {
      const bytes = this.byteView.mask;
      const bools = document.createElement("span");
      bools.textContent = bytes.join(", ");
      const bytesNode = document.getElementById("bytes-mask");
      bytesNode.innerHTML = "";
      bytesNode.appendChild(new Text("["));
      bytesNode.appendChild(bools);
      bytesNode.appendChild(new Text("]"));
    },
    setGuessed() {
      const bytes = this.byteView.guessed;
      const byteGroups = [];
      for (var i = 0; i < bytes.length; i += 4) {
        const group = document.createElement("span");
        group.textContent = bytes.slice(i, i+4).join(", ");
        byteGroups.push(group);
      }
      const bytesNode = document.getElementById("bytes-guessed");
      bytesNode.innerHTML = "";
      bytesNode.appendChild(new Text("["));
      for (group of byteGroups) {
        bytesNode.appendChild(group);
        bytesNode.appendChild(new Text(", "));
      }
      bytesNode.replaceChild(new Text("]"), bytesNode.childNodes[bytesNode.childNodes.length-1]);
    },
  };

  root.Bytes = Bytes;
})(window);

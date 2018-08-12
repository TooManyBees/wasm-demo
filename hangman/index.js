const inputField = document.getElementById("input-field");
const input = document.getElementById("input");
const graphic = document.getElementById("graphic");
const unmasked = document.getElementById("unmasked");
const wrongGuesses = new Set();
const wrongGuessesDom = document.getElementById("wrong-guesses");
const bytes = document.getElementById("bytes");

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
    const old = document.getElementById("bytes-hangman");
    const phrase = document.createElement("span");
    phrase.textContent = bytes.slice(0, 3).join(", ");
    const mask = document.createElement("span");
    mask.textContent = bytes.slice(3, 6).join(", ");
    const guessed = document.createElement("span");
    guessed.textContent = bytes.slice(6, 9).join(", ");
    const numGuesses = document.createElement("span");
    numGuesses.textContent = bytes[9];
    const gnew = document.createElement("code");
    gnew.id = "bytes-hangman";
    gnew.appendChild(new Text("["));
    gnew.appendChild(phrase);
    gnew.appendChild(new Text(", "));
    gnew.appendChild(mask);
    gnew.appendChild(new Text(", "));
    gnew.appendChild(guessed);
    gnew.appendChild(new Text(", "));
    gnew.appendChild(numGuesses);
    gnew.appendChild(new Text("]"));
    old.parentNode.replaceChild(gnew, old);
  },
  setPhrase() {
    const bytes = this.byteView.phrase;
    const old = document.getElementById("bytes-phrase");
    const byteGroups = [];
    for (var i = 0; i < bytes.length; i += 4) {
      const group = document.createElement("span");
      group.textContent = bytes.slice(i, i+4).join(", ");
      byteGroups.push(group);
    }
    const gnew = document.createElement("code");
    gnew.id = "bytes-phrase";
    gnew.appendChild(new Text("["));
    for (group of byteGroups) {
      gnew.appendChild(group);
      gnew.appendChild(new Text(", "));
    }
    gnew.replaceChild(new Text("]"), gnew.childNodes[gnew.childNodes.length-1]);
    old.parentNode.replaceChild(gnew, old);
  },
  setMask() {
    const bytes = this.byteView.mask;
    const old = document.getElementById("bytes-mask");
    const bools = document.createElement("span");
    bools.textContent = bytes.join(", ");
    const gnew = document.createElement("code");
    gnew.id = "bytes-mask";
    gnew.appendChild(new Text("["));
    gnew.appendChild(bools);
    gnew.appendChild(new Text("]"));
    old.parentNode.replaceChild(gnew, old);
  },
  setGuessed() {
    const bytes = this.byteView.guessed;
    const old = document.getElementById("bytes-guessed");
    const byteGroups = [];
    for (var i = 0; i < bytes.length; i += 4) {
      const group = document.createElement("span");
      group.textContent = bytes.slice(i, i+4).join(", ");
      byteGroups.push(group);
    }
    const gnew = document.createElement("code");
    gnew.id = "bytes-guessed";
    gnew.appendChild(new Text("["));
    for (group of byteGroups) {
      gnew.appendChild(group);
      gnew.appendChild(new Text(", "));
    }
    gnew.replaceChild(new Text("]"), gnew.childNodes[gnew.childNodes.length-1]);
    old.parentNode.replaceChild(gnew, old);
  },
};

const game = new Hangman("bees", {
  win: () => {
    endGame();
    console.log("win!");
  },
  lose: () => {
    endGame();
    console.log("lose!");
  },
  onload: (game) => {
    displayPhrase(game)
    Bytes.init(game.byteView());
  },
});

function guess(game, char) {
  if (game.guess(char)) {
    displayPhrase(game);
  } else {
    addWrongLetter(game, char);
    displayGraphic(game);
  }
  updateByteViews(game);
}
input.addEventListener("submit", function(e) {
  e.preventDefault();
  if (inputField.value) {
    console.info(`guessing '${inputField.value}'`);
    guess(game, inputField.value);
    inputField.value = "";
  }
})


function displayGraphic(game) {
  const remaining = game.guessesRemaining();
  graphic.setAttribute("guesses", remaining.toString());
}

function displayPhrase(game) {
  const unmaskedPhrase = game.unmasked().replace(/ /g, "_").split("").join(" ");
  unmasked.textContent = unmaskedPhrase;
}

function addWrongLetter(game, char) {
  if (!wrongGuesses.has(char)) {
    wrongGuesses.add(char);
    wrongGuessesDom.textContent = Array.from(wrongGuesses).sort().join(" ");
  }
}

function endGame() {
  inputField.disabled = true;
  inputField.placeholder = "";
}

function updateByteViews(game) {

}

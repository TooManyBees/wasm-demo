(function(root) {
  const initModal = document.getElementById("init-modal");
  const initForm = document.getElementById("init-form");
  const inputField = document.getElementById("input-field");
  const input = document.getElementById("input");
  const graphic = document.getElementById("graphic");
  const unmasked = document.getElementById("unmasked");
  const wrongGuessesDom = document.getElementById("wrong-guesses");

  let game = null;
  function win() {
    console.log("a winner is you!");
    inputField.disabled = true;
    inputField.placeholder = "";
    graphic.classList.add("rainbowned");
  }
  function lose() {
    console.log("you have failed and dishonored your ancestors");
    inputField.disabled = true;
    inputField.placeholder = "";
  }

  function guess(game, char) {
    if (game.guess(char)) {
      displayPhrase(game);
    } else {
      addWrongLetter(char);
      displayGraphic(game);
    }
    Bytes.setHangman();
    Bytes.setMask();
    Bytes.setGuessed();
  }
  input.addEventListener("submit", function(e) {
    e.preventDefault();
    if (inputField.value) {
      guess(game, inputField.value);
      inputField.value = "";
    }
  });

  function displayGraphic(game) {
    const remaining = game.guessesRemaining();
    graphic.setAttribute("guesses", remaining.toString());
  }

  function displayPhrase(game) {
    const unmaskedPhrase = game.unmasked().replace(/ /g, "_").split("").join(" ");
    unmasked.textContent = unmaskedPhrase;
  }

  const wrongGuesses = new Set();
  function addWrongLetter(char) {
    if (!wrongGuesses.has(char)) {
      wrongGuesses.add(char);
      wrongGuessesDom.textContent = Array.from(wrongGuesses).sort().join(" ");
    }
  }

  initModal.classList.remove("disabled");
  initForm.addEventListener("submit", function(e) {
    e.preventDefault();
    const phrase = document.getElementById("init-input").value;
    if (phrase) {
      game = new Hangman(phrase, {
        win,
        lose,
        onload: (game) => {
          displayPhrase(game)
          Bytes.init(game.byteView());
          initModal.classList.add("disabled");
        },
      });
      root.game = game;
    }
  });

  root.guess = guess;
})(window);

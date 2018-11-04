const initModal = document.getElementById("init-modal");
const initForm = document.getElementById("init-form");
const inputField = document.getElementById("input-field");
const input = document.getElementById("input");
const graphic = document.getElementById("graphic");
const unmasked = document.getElementById("unmasked");
const wrongGuessesDom = document.getElementById("wrong-guesses");

function win() {
  console.log("a winner is you!");
  inputField.disabled = true;
  inputField.placeholder = "";
  graphic.classList.add("rainbowned");
  const winner = document.createElement('div');
  winner.textContent = "WINNER";
  winner.classList.add('winner');
  winner.classList.add('rainbowned');
  document.body.appendChild(winner);
}
function lose() {
  console.log("you have failed and everyone laughs at your misfortune");
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
  ByteView.setHangman();
  ByteView.setMask();
  ByteView.setGuessed();
}
input.addEventListener("submit", function(e) {
  e.preventDefault();
  if (inputField.value) {
    guess(window.game, inputField.value);
    inputField.value = "";
  }
});

function displayGraphic(game) {
  const remaining = game.guessesRemaining();
  graphic.setAttribute("guesses", remaining.toString());
}

function displayPhrase(game) {
  unmasked.textContent = game.unmasked();
}

const wrongGuesses = new Set();
function addWrongLetter(char) {
  if (!wrongGuesses.has(char)) {
    wrongGuesses.add(char);
    wrongGuessesDom.textContent = Array.from(wrongGuesses).sort().join("");
  }
}

initModal.classList.remove("disabled");
initForm.addEventListener("submit", function(e) {
  e.preventDefault();
  const phrase = document.getElementById("init-input").value;
  if (phrase) {
    window.game = new Hangman(phrase, {
      win,
      lose,
      onload: (game) => {
        displayPhrase(game)
        ByteView.init(game.memoryViewer());
        initModal.classList.add("disabled");
      },
    });
  }
});

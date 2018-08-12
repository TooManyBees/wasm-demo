const inputField = document.getElementById("input-field");
const input = document.getElementById("input");
const graphic = document.getElementById("graphic");
const unmasked = document.getElementById("unmasked");
const wrongGuesses = new Set();
const wrongGuessesDom = document.getElementById("wrong-guesses");
const bytes = document.getElementById("bytes");

const game = new Hangman("bees", {
  win: () => {
    endGame();
    console.log("win!");
  },
  lose: () => {
    endGame();
    console.log("lose!");
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

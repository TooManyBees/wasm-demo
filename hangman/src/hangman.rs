pub struct Hangman {
    phrase: Vec<char>,
    unmasked: Vec<Option<()>>,
    already_guessed: Vec<char>,
    guesses: usize,
}

const MAX_GUESSES: usize = 6;

impl Hangman {
    pub fn new(phrase: &str) -> Hangman {
        let vec_phrase: Vec<char> = phrase.chars().collect();
        let vec_unmasked = vec![None; vec_phrase.len()];
        // A proper capacity should be `vec_phrase.len() + MAX_GUESSES`.
        // But this gives us the chance to observe the vec reallocating
        // its buffer as we play the game.
        let vec_guessed = Vec::with_capacity(MAX_GUESSES);
        Hangman {
            guesses: 0,
            phrase: vec_phrase,
            unmasked: vec_unmasked,
            already_guessed: vec_guessed,
        }
    }

    pub fn guess(&mut self, c: char) -> Status {
        if c == '\0' {
            return Status::Invalid;
        }
        if self.guesses >= MAX_GUESSES {
            return Status::Lose;
        }
        if self.unmasked.iter().all(|c| c.is_some()) {
            return Status::Win;
        }

        if self.already_guessed.contains(&c) {
            return Status::Invalid;
        } else {
            self.already_guessed.push(c);
        }

        // Decrement guesses if wrong
        if !self.phrase.contains(&c) {
            self.guesses += 1;
            // Check to see if player lost
            if self.guesses >= MAX_GUESSES {
                return Status::Lose;
            } else {
                return Status::Wrong;
            }
        }

        // Find indices of the matching letter
        let mut indices = vec![];
        for (idx, letter) in self.phrase.iter().enumerate() {
            if *letter == c {
                indices.push(idx);
            }
        }
        // Unmask the same indices
        for idx in indices.into_iter() {
            self.unmasked[idx] = Some(());
        }
        if self.unmasked.iter().all(|c| c.is_some()) {
            return Status::Win;
        }
        return Status::Correct;
    }

    pub fn guesses_remaining(&self) -> usize {
        MAX_GUESSES - self.guesses
    }

    pub fn unmasked(&self) -> String {
        self.unmasked.iter().zip(self.phrase.iter()).map(|(&s, &c)| {
            match s {
                Some(_) => c,
                None => ' ',
            }
        }).collect()
    }
}

pub enum Status {
    Correct,
    Wrong,
    Win,
    Lose,
    Invalid,
}

#[cfg(test)]
mod test {
    use super::{Hangman, Status, MAX_GUESSES};

    #[test]
    fn test_initial_state() {
        let game = Hangman::new("bees");
        assert_eq!(game.guesses_remaining(), MAX_GUESSES);
        assert_eq!(game.unmasked(), "    ");
    }

    #[test]
    fn test_correct_guess() {
        let mut game = Hangman::new("bees");
        let status = game.guess('e');
        assert_eq!(game.guesses_remaining(), MAX_GUESSES);
        assert_eq!(game.unmasked(), " ee ");
        if let Status::Correct = status {
        } else {
            assert!(false, "Correct guess should have returned Status::Correct");
        }

        let status_again = game.guess('e');
        assert_eq!(game.guesses_remaining(), MAX_GUESSES, "Guessing the same correct char should not change guesses_remaining");
        assert_eq!(game.unmasked(), " ee ", "Guessing the same correct char should not change the unmasked letters");
        if let Status::Invalid = status_again {
        } else {
            assert!(false, "Guessing the same correct char should return Status::Invalid");
        }
    }

    #[test]
    fn test_wrong_guess() {
        let mut game = Hangman::new("bees");
        let status = game.guess('z');
        assert_eq!(game.guesses_remaining(), MAX_GUESSES - 1);
        assert_eq!(game.unmasked(), "    ");
        if let Status::Wrong = status {
        } else {
            assert!(false, "Wrong guess should have returned Status::Wrong");
        }
        let status_again = game.guess('z');
        assert_eq!(game.guesses_remaining(), MAX_GUESSES - 1, "Guessing the same wrong char should not decrease guesses_remaining");
        assert_eq!(game.unmasked(), "    ", "Guessing the same wrong char should not change the unmasked letters");
        if let Status::Invalid = status_again {
        } else {
            assert!(false, "Guessing the same wrong char should have returned Status::Invalid");
        }
    }

    #[test]
    fn test_win() {
        let mut game = Hangman::new("bees");
        game.guess('b');
        game.guess('e');
        if let Status::Win = game.guess('s') {
        } else {
            assert!(false, "Guessing the final correct char should return Status::Win");
        }
        if let Status::Win = game.guess('x') {
        } else {
            assert!(false, "A wrong guess after winning should return Status::Win");
        }
    }

    #[test]
    fn test_lose() {
        let mut game = Hangman::new("bees");
        game.guess('l');
        game.guess('m');
        game.guess('n');
        game.guess('o');
        if let Status::Wrong = game.guess('p') {
        } else {
            assert!(false, "Guessing wrong should return Status::Wrong");
        }
        if let Status::Lose = game.guess('q') {
        } else {
            assert!(false, "Guessing wrong {} times should return Status::Lose", MAX_GUESSES);
        }
        if let Status::Lose = game.guess('b') {
        } else {
            assert!(false, "Guessing a correct char after already losing should return Status::Lose");
        }
    }

    #[test]
    fn test_multibyte_char() {
        let mut game = Hangman::new("croc🐊");
        if let Status::Correct = game.guess('🐊') {
        } else {
            assert!(false, "Guessing a multibyte char should work");
        }
        assert_eq!("    🐊", game.unmasked());
    }
}

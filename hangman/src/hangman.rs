use std::num::NonZeroU8;

pub struct Hangman {
    guesses: u8,
    phrase: Vec<char>,
    unmasked: Vec<Option<NonZeroU8>>,
    already_guessed: Vec<char>,
}

const MAX_GUESSES: u8 = 6;

impl Hangman {
    pub fn new(phrase: &str) -> Hangman {
        let vec_phrase: Vec<char> = phrase.chars().collect();
        let vec_unmasked = vec![None; vec_phrase.len()];
        let vec_guessed = Vec::with_capacity(vec_phrase.len() + MAX_GUESSES as usize);
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
        unsafe {
            for idx in indices.into_iter() {
                self.unmasked[idx] = Some(NonZeroU8::new_unchecked(c as u8));
            }
        }
        if self.unmasked.iter().all(|c| c.is_some()) {
            return Status::Win;
        }
        return Status::Correct;
    }

    pub fn guesses_remaining(&self) -> u8 {
        MAX_GUESSES - self.guesses
    }

    pub fn unmasked(&self) -> String {
        self.unmasked.iter().map(|c| {
            if let Some(letter) = c {
                letter.get().into()
            } else {
                ' '
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
}
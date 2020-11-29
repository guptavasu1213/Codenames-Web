package main

import (
	"database/sql"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/mattn/go-sqlite3"
)

func isUniqueViolation(err error) bool {
	if err, ok := err.(sqlite3.Error); ok {
		return err.Code == 19 && err.ExtendedCode == 1555
	}
	return false
}

func createNewGame(redCode string, blueCode string, spyCode string) error {
	tx, err := db.Beginx()
	if err != nil {
		log.Println("Begin transaction failed", err)
		return err
	}
	now := time.Now().Unix()
	rand.Seed(now)
	wordList := createWordList()

	randomNumber := rand.Intn(2)
	cardList := createCardList(randomNumber)

	var first string
	var red, blue int
	if randomNumber == 0 {
		first = "Blue"
		red = 8
		blue = 9
	} else {
		first = "Red"
		red = 9
		blue = 8
	}

	codes := [3]string{redCode, blueCode, spyCode}
	colour := [3]string{"Red", "Blue", "Spymaster"}
	count := [3]int{red, blue, 0}

	query := `INSERT INTO games (epoch, current_turn, streak) VALUES ($1, $2, $3)`
	result, err := tx.Exec(query, now, first, 0)
	if err != nil {
		log.Println("Add game table failed", err)
		tx.Rollback()
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Println("failed to get ID", err)
		tx.Rollback()
		return err
	}

	query = `INSERT INTO teams (game_id, team_code, owner, cards_remaining) VALUES ($1, $2, $3, $4)`
	for i := 0; i < 3; i++ {
		_, err = tx.Exec(query, id, codes[i], colour[i], count[i])
		if err != nil {
			if isUniqueViolation(err) {
				log.Println("violation unique", err)
				return err
			}
			log.Println("Add cards failed", err)
			tx.Rollback()
			return err
		}
	}

	query = `INSERT INTO cards (game_id, card_number, label, owner, visibility) VALUES ($1, $2, $3, $4, $5)`
	for i := 0; i < 25; i++ {
		result, err = tx.Exec(query, id, i+1, wordList[i], cardList[i], 0)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	tx.Commit()
	return err
}

// Retrieves the owner of the team code and game id
func getGameInfo(w http.ResponseWriter, state *gameState) error {
	query := `SELECT game_id, owner 
						FROM Teams
						WHERE team_code = $1`
	err := db.Get(state, query, (*state).TeamCode)
	if err == sql.ErrNoRows {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		log.Println("no Entries found")
	} else if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("unsuccessful data lookup:", err)
	}
	return err
}

// Gets card owner for the given game and card number
func getCardOwner(w http.ResponseWriter, gameID int64, cardNumber int) (string, error) {
	ownerName := ""

	query := `SELECT owner
						FROM Cards
						WHERE game_id = $1 and card_number = $2`
	err := db.Get(&ownerName, query, gameID, cardNumber)
	if err == sql.ErrNoRows {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		log.Println("no Entries found")
	} else if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("unsuccessful data lookup")
	}

	return ownerName, err
}

// Set the visibility of the given card to true
func makeSelectedCardVisible(w http.ResponseWriter, gameID int64, cardNumber int) error {
	query := `UPDATE Cards 
				SET visibility = 1 
				WHERE game_id = $1 and card_number = $2`
	_, err := db.Exec(query, gameID, cardNumber)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful card visibility update")
	} else {
		log.Println("Card visibility updated successfully")
	}

	return err
}

// Increment the streak for the game
func incrementStreak(w http.ResponseWriter, gameID int64) error {
	query := `UPDATE Games 
				SET streak = streak + 1 
				WHERE game_id = $1`

	_, err := db.Exec(query, gameID)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful streak increment")
	} else {
		log.Println("Streak incremented successfully")
	}

	return err
}

// Set streak to zero and switch the turn to other team
func removeStreakAndSwitchTurn(w http.ResponseWriter, gameID int64, oppositeTeam string) error {
	query := `UPDATE Games 
				SET streak = 0, current_turn = $1
				WHERE game_id = $2`

	_, err := db.Exec(query, oppositeTeam, gameID)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful streak removal and turn switching")
	} else {
		log.Println("Removed streak and switched turn successfully")
	}

	return err
}

// Decrement the remaining card count for the given team
func decrementRemainingCardCount(w http.ResponseWriter, gameID int64, teamName string) error {
	query := `UPDATE Teams 
				SET cards_remaining = cards_remaining - 1 
				WHERE game_id = $1 and owner = $2`

	_, err := db.Exec(query, gameID, teamName)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful card count decrement")
	} else {
		log.Println("Card count decremented successfully")
	}

	return err
}

// Get remaining cards for the team
func getRemainingCardNum(w http.ResponseWriter, gameID int64, teamName string) (int, error) {
	var remainingCards int
	query := `SELECT cards_remaining 
				FROM Teams
				WHERE game_id = $1 and owner = $2`
	err := db.Get(&remainingCards, query, gameID, teamName)
	if err == sql.ErrNoRows {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		log.Println("no Entries found")
	} else if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful retrieval of remaining card count")
	}

	return remainingCards, err
}

// Get the turn and the streak for the game
func getTurnAndStreak(w http.ResponseWriter, state *gameState) error {
	query := `SELECT current_turn, streak 
				FROM Games
				WHERE game_id = $1`
	err := db.Get(state, query, (*state).GameID)
	if err == sql.ErrNoRows {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		log.Println("no Entries found")
	} else if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful retrieval of turn and streak")
	}

	return err
}

// Get card information including the labels, owner and visibility
func getCardInfo(w http.ResponseWriter, state *gameState) error {
	query := `SELECT label, owner, visibility 
				FROM Cards
				WHERE game_id = $1`
	err := db.Select(&(*state).Cards, query, (*state).GameID)
	if err == sql.ErrNoRows {
		http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
		log.Println("no Entries found")
	} else if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: unsuccessful retrieval of remaining card info", err)
	}

	return err
}

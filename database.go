package main

import (
	"database/sql"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/mattn/go-sqlite3"
)

// Detects Primary Key Violation
func isUniqueViolation(err error) bool {
	if err, ok := err.(sqlite3.Error); ok {
		return err.Code == 19 && err.ExtendedCode == 1555
	}
	return false
}

// Retrieve Game Codes for Spymaster, Red, and Blue teams.
func retrieveCodes(gameID int64) ([3]string, error) {
	colour := [3]string{redTeam, blueTeam, spymasterTeam}
	codes := [3]string{}
	var err error

	for i := 0; i < 3; i++ {
		query := `SELECT team_code
						FROM Teams
						WHERE game_id = $1 and owner = $2`
		err := db.Get(&codes[i], query, gameID, colour[i])
		if err != nil {
			log.Println("no entries found", err)
		}
	}

	return codes, err
}

// Delete game with the given ID from the DB
func deleteExistingGame(gameID int64) error {
	query := `PRAGMA foreign_keys = ON;
	DELETE FROM Games where game_id = $1`

	_, err := db.Exec(query, gameID)
	if err != nil {
		log.Println("Cannot delete game", err)
		return err
	}

	return err

}

// Create new game from generated codes
func createNewGame(redCode string, blueCode string, spyCode string) (int64, error) {
	tx, err := db.Beginx()
	if err != nil {
		log.Println("Begin transaction failed", err)
		return 0, err
	}
	now := time.Now().Unix()
	rand.Seed(now)
	wordList := createWordList()

	randomNumber := rand.Intn(2)
	cardList := createCardList(randomNumber)

	var first string
	var redCardCount, blueCardCount int
	if randomNumber == 0 {
		first = blueTeam
		redCardCount = 8
		blueCardCount = 9
	} else {
		first = redTeam
		redCardCount = 9
		blueCardCount = 8
	}

	codes := [3]string{redCode, blueCode, spyCode}
	colour := [3]string{redTeam, blueTeam, spymasterTeam}
	count := [3]int{redCardCount, blueCardCount, 0}

	// Insert new game to games table in the database
	query := `INSERT INTO games (epoch, current_turn, streak, has_ended) VALUES ($1, $2, $3, $4)`
	result, err := tx.Exec(query, now, first, 0, 0)
	if err != nil {
		log.Println("Add game table failed", err)
		tx.Rollback()
		return 0, err
	}

	// Retrieve the gameID for reference key later
	id, err := result.LastInsertId()
	if err != nil {
		log.Println("failed to get ID", err)
		tx.Rollback()
		return 0, err
	}

	// Insert 3 team codes with gameID
	query = `INSERT INTO teams (game_id, team_code, owner, cards_remaining) VALUES ($1, $2, $3, $4)`
	for i := 0; i < 3; i++ {
		_, err = tx.Exec(query, id, codes[i], colour[i], count[i])
		if err != nil {
			log.Println("Add cards failed", err)
			tx.Rollback()
			return 0, err
		}
	}

	// Insert 25 cards with gameID
	query = `INSERT INTO cards (game_id, card_number, label, owner, visibility) VALUES ($1, $2, $3, $4, $5)`
	for i := 0; i < 25; i++ {
		result, err = tx.Exec(query, id, i+1, wordList[i], cardList[i], 0)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
	}
	err = tx.Commit()
	if err != nil {
		log.Println("Error while committing the transaction:", err)
	}

	return id, err
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
func getCardOwner(gameID int64, cardNumber int) (string, error) {
	ownerName := ""

	query := `SELECT owner
						FROM Cards
						WHERE game_id = $1 and card_number = $2`
	err := db.Get(&ownerName, query, gameID, cardNumber)
	if err == sql.ErrNoRows {
		log.Println("no Entries found")
	} else if err != nil {
		log.Println("unsuccessful data lookup")
	}

	return ownerName, err
}

// Set the visibility of the given card to true
func makeSelectedCardVisible(tx *sqlx.Tx, gameID int64, cardNumber int) error {
	query := `UPDATE Cards 
				SET visibility = 1 
				WHERE game_id = $1 and card_number = $2`
	_, err := tx.Exec(query, gameID, cardNumber)
	if err != nil {
		tx.Rollback()
		log.Println("error: unsuccessful card visibility update")
	} else {
		log.Println("Card visibility updated successfully")
	}

	return err
}

// Increment the streak for the game
func incrementStreak(tx *sqlx.Tx, gameID int64) error {
	query := `UPDATE Games 
				SET streak = streak + 1 
				WHERE game_id = $1`

	_, err := tx.Exec(query, gameID)
	if err != nil {
		tx.Rollback()
		log.Println("error: unsuccessful streak increment")
	} else {
		log.Println("Streak incremented successfully")
	}

	return err
}

// Set streak to zero and switch the turn to other team
func removeStreakAndSwitchTurn(tx *sqlx.Tx, gameID int64, oppositeTeam string) error {
	query := `UPDATE Games 
				SET streak = 0, current_turn = $1
				WHERE game_id = $2`

	_, err := tx.Exec(query, oppositeTeam, gameID)
	if err != nil {
		tx.Rollback()
		log.Println("error: unsuccessful streak removal and turn switching")
	} else {
		log.Println("Removed streak and switched turn successfully")
	}

	return err
}

// Decrement the remaining card count for the given team
func decrementRemainingCardCount(tx *sqlx.Tx, gameID int64, teamName string) error {
	query := `UPDATE Teams 
				SET cards_remaining = cards_remaining - 1 
				WHERE game_id = $1 and owner = $2`

	_, err := tx.Exec(query, gameID, teamName)
	if err != nil {
		tx.Rollback()
		log.Println("error: unsuccessful card count decrement")
	} else {
		log.Println("Card count decremented successfully")
	}

	return err
}

// Get remaining cards for the team
func getRemainingCardNum(gameID int64, teamName string) (int, error) {
	var remainingCards int
	query := `SELECT cards_remaining 
				FROM Teams
				WHERE game_id = $1 and owner = $2`
	err := db.Get(&remainingCards, query, gameID, teamName)
	if err == sql.ErrNoRows {
		log.Println("no Entries found")
	} else if err != nil {
		log.Println("error: unsuccessful retrieval of remaining card count")
	}

	return remainingCards, err
}

// Get the turn and the streak for the game
func getTurnAndStreakAndStatus(state *gameState) error {
	query := `SELECT current_turn, streak, has_ended
				FROM Games
				WHERE game_id = $1`
	err := db.Get(state, query, (*state).GameID)
	if err == sql.ErrNoRows {
		log.Println("no Entries found")
	} else if err != nil {
		log.Println("error: unsuccessful retrieval of turn and streak")
	}

	return err
}

// Get card information including the labels, owner and visibility
func getCardInfo(state *gameState) error {
	cards := []card{}
	query := `SELECT label, owner, visibility 
				FROM Cards
				WHERE game_id = $1`
	err := db.Select(&cards, query, (*state).GameID)
	if err == sql.ErrNoRows {
		log.Println("no Entries found")
	} else if err != nil {
		log.Println("error: unsuccessful retrieval of remaining card info", err)
	} else {
		(*state).Cards = cards
	}
	return err
}

// End the game with given ID
func endGame(tx *sqlx.Tx, gameID int64) error {
	query := `UPDATE Games 
				SET has_ended = 1 
				WHERE game_id = $1`

	_, err := tx.Exec(query, gameID)
	if err != nil {
		tx.Rollback()
		log.Println("Cannot change endGame stauts", err)
		return err
	}

	return err
}

// Check if the game has ended
func hasGameEnded(gameID int64) (bool, error) {
	var status bool
	query := `SELECT has_ended
				FROM Games
				WHERE game_id = $1`

	err := db.Get(&status, query, gameID)
	if err != nil {
		log.Println("no entries found", err)
		return status, err
	}

	return status, err

}

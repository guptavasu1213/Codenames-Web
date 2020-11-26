package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// Handler for serving HTML file for the home page
func handlerToRetrieveHomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./dist/static/index.html")

}

func randomHex(n int) (string, error) {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// Handler for creating the game
func handleCreateGame(w http.ResponseWriter, r *http.Request) {
	redLink, _ := randomHex(3)
	blueLink, _ := randomHex(3)
	spyLink, _ := randomHex(3)

	createNewGame(redLink, blueLink, spyLink)

	links := links{RedLink: redLink, BlueLink: blueLink, SpyLink: spyLink}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(links)
}

// Handler for joining the game
func handleJoinGame(w http.ResponseWriter, r *http.Request) {
	gameCode := mux.Vars(r)["game_code"]

	fmt.Println(gameCode)

	// Check who the owner of the link is
}

// Retrieve selected card number for the game from the JSON
func getUserSelectionFromJSON(w http.ResponseWriter, r *http.Request) (int, error) {
	type selection struct {
		CardNumber int `json:"cardClickedNumber"`
	}
	userSelection := selection{}

	err := json.NewDecoder(r.Body).Decode(&userSelection)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		log.Println("error: decoding error occured", err)
	}
	return userSelection.CardNumber, err
}

// Updates the logistics of the game based on the current and opposite team info
func updateGameForTeam(w http.ResponseWriter, r *http.Request, currentTeam string, oppositeTeam string, state *gameState) error {
	selectedCardNum, err := getUserSelectionFromJSON(w, r)
	if err != nil {
		return err
	}

	// Get the real owner of the card clicked by the user
	var cardOwner string
	cardOwner, err = getCardOwner(w, (*state).GameID, selectedCardNum)
	if err != nil {
		return err
	}

	makeSelectedCardVisible(w, (*state).GameID, selectedCardNum)

	if cardOwner == "Assassin" {
		log.Println("Selected Assassin Card")

		(*state).HasEnded = true

		// game over
		// Send JSON with a field game_over: true

	} else if cardOwner == "Bystander" {
		log.Println("Selected Bystander Card")

		// Set streak to zero and switch the turn to other team
		err = removeStreakAndSwitchTurn(w, (*state).GameID, oppositeTeam)
		if err != nil {
			return err
		}
	} else if cardOwner == currentTeam {
		log.Println("Selected Own Card")

		// Increment streak
		err = incrementStreak(w, (*state).GameID)
		if err != nil {
			return err
		}

		// Decrease the remaining cards
		decrementRemainingCardCount(w, (*state).GameID, currentTeam)
		if err != nil {
			return err
		}

	} else {
		log.Println("Selected Opposite Team Card")

		// Set streak to zero and switch the turn to other team
		err = removeStreakAndSwitchTurn(w, (*state).GameID, oppositeTeam)
		if err != nil {
			return err
		}

		// Decrease the remaining cards
		decrementRemainingCardCount(w, (*state).GameID, oppositeTeam)
		if err != nil {
			return err
		}
	}
	return nil
}

// Generate game state by retrieving values from the database
func generateGameState(w http.ResponseWriter, state *gameState) error {
	// Get remaining cards for both teams
	var err error
	(*state).RedCardsRemaining, err = getRemainingCardNum(w, (*state).GameID, "Red")
	if err != nil {
		return err
	}
	(*state).BlueCardsRemaining, err = getRemainingCardNum(w, (*state).GameID, "Blue")
	if err != nil {
		return err
	}

	// Get the turn and streak
	err = getTurnAndStreak(w, state)
	if err != nil {
		return err
	}

	// Get the card info
	getCardInfo(w, state)
	if err != nil {
		return err
	}

	// Obfuscate the owner names if the spymaster is
	if (*state).Owner != "Spymaster" {
		for i, card := range state.Cards {
			if !card.Visible {
				state.Cards[i].Owner = "N/A"
			}
		}
	}
	return nil
}

// Handler for the Endpoint for Game Updates
func handleGameUpdates(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL.RequestURI(), r.Method)

	state := gameState{}
	state.TeamCode = mux.Vars(r)["game_code"]

	err := getGameInfo(w, &state)
	if err != nil {
		return
	}

	// Check game code owners
	if state.Owner == "Spymaster" {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		log.Println("error: spymasters cannot select cards")
		return
	} else if state.Owner == "Red" {
		err = updateGameForTeam(w, r, "Red", "Blue", &state)

	} else { // Blue
		err = updateGameForTeam(w, r, "Blue", "Red", &state)
	}
	if err != nil {
		return
	}

	// Generate game state from the DB
	err = generateGameState(w, &state)
	if err != nil {
		return
	}

	// Send JSON to the client
	w.Header().Set("Content-Type", "application/json")

	err = json.NewEncoder(w).Encode(state)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		log.Println("error: encoding unsuccessful")
	}
}

// Handler for joining the game
func handleJoinPageServing(w http.ResponseWriter, r *http.Request) {
	gameID := mux.Vars(r)["game_code"]

	fmt.Println(gameID)

	// Check who the owner of the link is
}

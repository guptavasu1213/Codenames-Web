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
		CardNumber int `json:"card_clicked_number"`
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
func updateGameForTeam(w http.ResponseWriter, r *http.Request, currentTeam string, oppositeTeam string, state *gameState) {
	selectedCardNum, err := getUserSelectionFromJSON(w, r)
	if err != nil {
		return
	}

	// Get the real owner of the card clicked by the user
	var cardOwner string
	cardOwner, err = getCardOwner(w, (*state).GameID, selectedCardNum)
	if err != nil {
		return
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
			return
		}
	} else if cardOwner == currentTeam {
		log.Println("Selected Own Card")

		// Increment streak
		err = incrementStreak(w, (*state).GameID)
		if err != nil {
			return
		}

		// Decrease the remaining cards
		decrementRemainingCardCount(w, (*state).GameID, currentTeam)
		if err != nil {
			return
		}

	} else {
		log.Println("Selected Opposite Team Card")

		// Set streak to zero and switch the turn to other team
		err = removeStreakAndSwitchTurn(w, (*state).GameID, oppositeTeam)
		if err != nil {
			return
		}

		// Decrease the remaining cards
		decrementRemainingCardCount(w, (*state).GameID, oppositeTeam)
		if err != nil {
			return
		}
	}
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

	if state.Owner == "Spymaster" {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		log.Println("error: spymasters cannot select cards")
	} else if state.Owner == "Red" {
		updateGameForTeam(w, r, "Red", "Blue", &state)

	} else { // Blue
		updateGameForTeam(w, r, "Blue", "Red", &state)
	}

	// Update all clients with the game state
	// Get game state
	// Send it over
}

// Handler for joining the game
func handleJoinPageServing(w http.ResponseWriter, r *http.Request) {
	gameID := mux.Vars(r)["game_code"]

	fmt.Println(gameID)

	// Check who the owner of the link is
}

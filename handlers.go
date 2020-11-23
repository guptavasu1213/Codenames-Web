package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

// Handler for serving HTML file for the home page
func handlerToRetrieveHomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./dist/index.html")

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
	gameID := mux.Vars(r)["game_id"]

	fmt.Println(gameID)

	// Check who the owner of the link is
}

// Handler for joining the game
func handleJoinPageServing(w http.ResponseWriter, r *http.Request) {
	gameID := mux.Vars(r)["game_id"]

	fmt.Println(gameID)

	// Check who the owner of the link is
}

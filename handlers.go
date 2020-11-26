package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"

	// using for getting random words

	"github.com/gorilla/mux"
)

// Handler for serving HTML file for the home page
func handlerToRetrieveHomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./dist/static/menu.html")

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

	links := links{RedLink: redLink, BlueLink: blueLink, SpyLink: spyLink}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(links)
}

// Handler for joining the game
func handleJoinGame(w http.ResponseWriter, r *http.Request) {
	gameID := mux.Vars(r)["game_id"]
	fmt.Println(gameID)
}

// Handler for joining the game
func handleJoinPageServing(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./dist/static/gameplay.html")
}

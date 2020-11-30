package main

import (
	"bufio"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Handler for serving HTML file for the home page
func handlerToRetrieveHomePage(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "./dist/static/menu.html")

}

func createWordList() []string {
	wordList := []string{}
	pickList := []string{}

	// Read from a file line by line
	file, err := os.Open("wordlist.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		wordList = append(wordList, scanner.Text())
	}

	if err != nil {
		log.Fatal(err)
	}

	for i := 0; i < 25; i++ {
		randomIndex := rand.Intn(len(wordList))
		pickList = append(pickList, wordList[randomIndex])
		copy(wordList[randomIndex:], wordList[randomIndex+1:])
		wordList[len(wordList)-1] = ""
		wordList = wordList[:len(wordList)-1]
	}

	return pickList
}

func createCardList(numb int) []string {
	var red, blue int
	if numb == 0 {
		red = 8
		blue = 9
	} else {
		red = 9
		blue = 8
	}

	cardList := []string{}
	for i := 0; i < red; i++ {
		cardList = append(cardList, "Red")
	}

	for i := 0; i < blue; i++ {
		cardList = append(cardList, "Blue")
	}

	for i := 0; i < 7; i++ {
		cardList = append(cardList, "Bystander")
	}

	cardList = append(cardList, "Assassin")
	rand.Shuffle(len(cardList), func(i, j int) {
		cardList[i], cardList[j] = cardList[j], cardList[i]
	})
	return cardList
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
	rand.Seed(time.Now().Unix())
	redCode, _ := randomHex(3)
	blueCode, _ := randomHex(3)
	spyCode, _ := randomHex(3)

	err := createNewGame(redCode, blueCode, spyCode)
	if err != nil {
		log.Println("Cannot add new game", err)
		return
	}

	links := links{RedCode: redCode, BlueCode: blueCode, SpyCode: spyCode}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(links)
}

// Updates the logistics of the game based on the current and opposite team info
func updateGameForTeam(w http.ResponseWriter, update clientUpdate, currentTeam string, oppositeTeam string, state *gameState) error {
	// Get the real owner of the card clicked by the user
	cardOwner, err := getCardOwner(w, (*state).GameID, update.ClickedCardNum)
	if err != nil {
		return err
	}

	makeSelectedCardVisible(w, (*state).GameID, update.ClickedCardNum)

	if cardOwner == "Assassin" {
		log.Println("Selected Assassin Card")
		(*state).HasEnded = true

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

// Obfuscate the card owner information by replacing it with "N/A"
func (state *gameState) obfuscateCardData() {
	for i, card := range (*state).Cards {
		if !card.Visible {
			(*state).Cards[i].Owner = "N/A"
		}
	}
}

// Generate game state by retrieving values from the database
func (state *gameState) generate(w http.ResponseWriter) error {
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
	return nil
}

// Switch the game to a new game- deletes the previous game, create a new one.
// Game ID is updated in the web socket connections
// Game ID is updated in the game state
// hasEnded is switched back to false
// Links are kept the same
func switchToNewGame(w http.ResponseWriter, state *gameState) error {
	log.Println("New game is initiated")
	return nil
}

// Game Updates are made by the user and are stored in the client update
func updateGameByPlayer(w http.ResponseWriter, update clientUpdate, state *gameState) error {
	if update.NextGameInitiated {
		return switchToNewGame(w, state)
	}
	// Check game code owners
	if (*state).Owner == "Spymaster" {
		http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		log.Println("error: spymasters cannot select cards")
		return errors.New("spymasters cannot select cards")
	} else if (*state).Owner == "Red" {
		// When end turn is clicked by Red team
		if update.EndTurnClicked {
			return removeStreakAndSwitchTurn(w, (*state).GameID, "Blue")
		}

		return updateGameForTeam(w, update, "Red", "Blue", state)
	} else { // Blue
		// When end turn is clicked by Blue team
		if update.EndTurnClicked {
			return removeStreakAndSwitchTurn(w, (*state).GameID, "Red")
		}

		return updateGameForTeam(w, update, "Blue", "Red", state)
	}
}

// Send the game state to the client based on who the game owner is
// Obfuscate card data when the player is not a spymaster
func sendGameStateToClient(connection *websocket.Conn, state gameState, owner string) {
	state.Owner = owner

	if owner != "Spymaster" {
		state.obfuscateCardData()
	}

	err := connection.WriteJSON(&state)
	if err != nil {
		log.Println(err)
		return
	}
}

// Listening on a websocket for the updates made by the client and broadcast it with all connected clients in the same game
func listenToClient(w http.ResponseWriter, r *http.Request, conn *websocket.Conn, state *gameState) {
	for {
		update := clientUpdate{}
		// Listens for an update from the client
		err := conn.ReadJSON(&update)
		if err != nil {
			log.Println("Error Parsing JSON", err)
			connections.deleteConnection((*state).GameID, conn)
			return
		}

		log.Printf("\n\n%+v\n\n", update) //////////////////////////////

		// Make changes to the game based on the update
		if updateGameByPlayer(w, update, state) != nil {
			return
		}
		// Generate game state
		state.generate(w)

		// Get list of connections for the current game
		ownerList, socketList, ok := connections.getConnectionList((*state).GameID)
		if !ok {
			return
		}
		connections.showAll() //////////////////////////////

		// Broadcast the gameState to all the connections
		for i, connection := range socketList {
			sendGameStateToClient(connection, *state, ownerList[i])
		}
	}
}

// Handler for joining the game
func handleJoinGame(w http.ResponseWriter, r *http.Request) {
	state := gameState{}
	state.TeamCode = mux.Vars(r)["game_code"]

	err := getGameInfo(w, &state)
	if err != nil {
		return
	}

	connection, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Could not open websocket connection", http.StatusBadRequest)
		log.Println("error: unsuccessful while upgrading to websocket")
	}

	log.Println("CLIENT SUCCESSFULLY CONNECTED")

	// Generate game state
	state.generate(w)

	// Send existing game state
	sendGameStateToClient(connection, state, state.Owner)

	// Add to the connection pool
	connections.addConnection(state.GameID, []string{state.Owner}, []*websocket.Conn{connection})
	listenToClient(w, r, connection, &state)
}

// Handler for joining the game
func handleJoinPageServing(w http.ResponseWriter, r *http.Request) {
	gameID := mux.Vars(r)["game_code"]

	fmt.Println(gameID)
	http.ServeFile(w, r, "./dist/static/gameplay.html")
}

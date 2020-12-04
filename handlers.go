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
		cardList = append(cardList, redTeam)
	}

	for i := 0; i < blue; i++ {
		cardList = append(cardList, blueTeam)
	}

	for i := 0; i < 7; i++ {
		cardList = append(cardList, bystanderCard)
	}

	cardList = append(cardList, assassinCard)
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
	var redCode, blueCode, spyCode string

	for {
		redCode, _ = randomHex(3)
		blueCode, _ = randomHex(3)
		spyCode, _ = randomHex(3)

		_, err := createNewGame(redCode, blueCode, spyCode)
		if err != nil {
			if isUniqueViolation(err) {
				log.Println("primary key violation occured", err)
			} else {
				http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
				log.Println("error: cannot create new game", err)
				return
			}
		} else {
			log.Println("Created a new game successfully")
			break
		}
	}

	links := links{RedCode: redCode, BlueCode: blueCode, SpyCode: spyCode}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(links)
}

// Updates the logistics of the game based on the current and opposite team info
func updateGameForTeam(update clientUpdate, currentTeam string, oppositeTeam string, state *gameState) error {
	// Get the real owner of the card clicked by the user
	cardOwner, err := getCardOwner((*state).GameID, update.ClickedCardNum)
	if err != nil {
		return err
	}

	tx, err := db.Beginx()
	if err != nil {
		return err
	}

	err = makeSelectedCardVisible(tx, (*state).GameID, update.ClickedCardNum)
	if err != nil {
		return err
	}

	if cardOwner == assassinCard {
		log.Println("Selected Assassin Card")
		err = endGame(tx, (*state).GameID)
		if err != nil {
			return err
		}
	} else if cardOwner == bystanderCard {
		log.Println("Selected Bystander Card")

		// Set streak to zero and switch the turn to other team
		err = removeStreakAndSwitchTurn(tx, (*state).GameID, oppositeTeam)
		if err != nil {
			return err
		}
	} else if cardOwner == currentTeam {
		log.Println("Selected Own Card")

		// Increment streak
		err = incrementStreak(tx, (*state).GameID)
		if err != nil {
			return err
		}

		// Decrease the remaining cards
		decrementRemainingCardCount(tx, (*state).GameID, currentTeam)
		if err != nil {
			return err
		}

	} else {
		log.Println("Selected Opposite Team Card")

		// Set streak to zero and switch the turn to other team
		err = removeStreakAndSwitchTurn(tx, (*state).GameID, oppositeTeam)
		if err != nil {
			return err
		}

		// Decrease the remaining cards
		decrementRemainingCardCount(tx, (*state).GameID, oppositeTeam)
		if err != nil {
			return err
		}
	}
	err = tx.Commit()
	if err != nil {
		log.Println("error: could not commit transaction:", err)
		return err
	}
	return nil
}

// Obfuscate the card owner information by replacing it with "N/A"
func obfuscateCardData(cardArr []card) []card {
	for i, card := range cardArr {
		if !card.Visible {
			cardArr[i].Owner = "N/A"
		}
	}
	return cardArr
}

// Generate game state by retrieving values from the database
func (state *gameState) generate() error {
	// Get remaining cards for both teams
	var err error
	(*state).RedCardsRemaining, err = getRemainingCardNum((*state).GameID, redTeam)
	if err != nil {
		return err
	}
	(*state).BlueCardsRemaining, err = getRemainingCardNum((*state).GameID, blueTeam)
	if err != nil {
		return err
	}

	// If any team has won, then we end the game
	if (*state).RedCardsRemaining == 0 || (*state).BlueCardsRemaining == 0 {
		tx, err := db.Beginx()
		if err != nil {
			return err
		}
		err = endGame(tx, (*state).GameID)
		if err != nil {
			return err
		}
		err = tx.Commit()
		if err != nil {
			log.Println("error: could not commit transaction:", err)
			return err
		}
	}

	// Get the turn and streak
	err = getTurnAndStreakAndStatus(state)
	if err != nil {
		return err
	}

	// Get the card info
	getCardInfo(state)
	if err != nil {
		return err
	}
	return nil
}

// Switch the game to a new game- deletes the previous game, create a new one while keeping the game codes same
func switchToNewGame(state *gameState) error {
	log.Println("New game is initiated")

	// Retrieving exist codes
	gameCodes, err := retrieveCodes((state).GameID)
	if err != nil {
		log.Println("Cannot retrieve code", err)
		return err
	}

	// Deleting old game data
	err = deleteExistingGame((state).GameID)
	if err != nil {
		log.Println("Cannot delete existing game", err)
		return err
	}

	// Creating new game
	newGameID, err := createNewGame(gameCodes[0], gameCodes[1], gameCodes[2])
	if err != nil {
		log.Println("Cannot create new game", err)
		return err
	}

	// Switching game id in the connection map
	connections.switchKey((*state).GameID, newGameID)

	// Replacing the new game id with the old game id
	(state).GameID = newGameID

	return nil
}

// Game Updates are made by the user and are stored in the client update
func updateGameByPlayer(update clientUpdate, state *gameState) error {
	if update.NextGameInitiated {
		return switchToNewGame(state)
	}

	var err error
	(*state).HasEnded, err = hasGameEnded((*state).GameID)
	if err != nil {
		return err
	}

	if (*state).HasEnded {
		log.Println("error: game has already ended- cannot update game")
		// Add to error field
		return errors.New("error: game has already ended- cannot update game")
	}

	tx, err := db.Beginx()
	if err != nil {
		return err
	}

	// Check game code owners
	if (*state).Owner == spymasterTeam {
		// http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		log.Println("error: spymasters cannot select cards")
		return errors.New("spymasters cannot select cards")
	} else if (*state).Owner == redTeam {
		// When end turn is clicked by Red team
		if update.EndTurnClicked {
			err = removeStreakAndSwitchTurn(tx, (*state).GameID, blueTeam)
			if err != nil {
				return err
			}
			err = tx.Commit()
			if err != nil {
				log.Println("error: could not commit transaction:", err)
				return err
			}
		}

		return updateGameForTeam(update, redTeam, blueTeam, state)
	} else { // Blue
		// When end turn is clicked by Blue team
		if update.EndTurnClicked {
			err = removeStreakAndSwitchTurn(tx, (*state).GameID, redTeam)
			if err != nil {
				return err
			}
			err = tx.Commit()
			if err != nil {
				log.Println("error: could not commit transaction:", err)
				return err
			}
		}
		return updateGameForTeam(update, blueTeam, redTeam, state)
	}
}

// Send the game state to the client based on who the game owner is
// Obfuscate card data when the player is not a spymaster and when game is in progress
func sendGameStateToClient(connection *websocket.Conn, state gameState, owner string) {
	state.Owner = owner

	// When the owner of the code is not spymaster and game has not ended
	if owner != spymasterTeam && !state.HasEnded {
		log.Println("OBFUSCATE DATA")
		b := make([]card, len(state.Cards))
		copy(b, state.Cards)
		state.Cards = obfuscateCardData(b)
	}

	err := connection.WriteJSON(&state)
	if err != nil {
		log.Println(err)
		return
	}
}

// Listening on a websocket for the updates made by the client and broadcast it with all connected clients in the same game
func listenToClient(r *http.Request, conn *websocket.Conn, state *gameState) {
	for {
		update := clientUpdate{}
		// Listens for an update from the client
		err := conn.ReadJSON(&update)
		if err != nil {
			log.Println("error: JSON parsing failed", err)
			connections.deleteConnection((*state).GameID, conn)
			return
		}

		// Make changes to the game based on the update
		if updateGameByPlayer(update, state) != nil {
			continue
		}
		// Generate game state
		state.generate()

		// Get list of connections for the current game
		ownerList, socketList, ok := connections.getConnectionList((*state).GameID)
		if !ok {
			return
		}

		// Broadcast the gameState to all the connections
		for i, connection := range socketList {
			sendGameStateToClient(connection, (*state), ownerList[i])
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
		return
	}

	log.Println("Client connection successfully upgraded to a websocket")

	// Generate game state
	state.generate()

	// Send existing game state
	sendGameStateToClient(connection, state, state.Owner)

	// Add to the connection pool
	connections.addConnection(state.GameID, []string{state.Owner}, []*websocket.Conn{connection})
	listenToClient(r, connection, &state)
}

// Handler for joining the game
func handleJoinPageServing(w http.ResponseWriter, r *http.Request) {
	gameID := mux.Vars(r)["game_code"]

	fmt.Println(gameID)
	http.ServeFile(w, r, "./dist/static/gameplay.html")
}

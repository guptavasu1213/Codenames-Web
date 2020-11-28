package main

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/jmoiron/sqlx"
)

type links struct {
	RedLink  string `json:"redLink"`
	BlueLink string `json:"blueLink"`
	SpyLink  string `json:"spyLink"`
}

type card struct {
	Label   string `json:"label" db:"label,omitempty"`
	Visible bool   `json:"visible" db:"visibility,omitempty"`
	Owner   string `json:"owner" db:"owner,omitempty"`
}

type clientUpdate struct {
	ClickedCardNum    int  `json:"cardClickedNumber"`
	EndTurnClicked    bool `json:"endTurnClicked"`
	NextGameInitiated bool `json:"nextGameInitiated"`
}

type gameState struct {
	GameID             int64  `json:"-" db:"game_id,omitempty"`
	TeamCode           string `json:"-" db:"team_code,omitempty"`
<<<<<<< HEAD
	Owner              string `json:"teamName" db:"owner,omitempty"` // Red, Blue or Spymaster
=======
	Owner              string `json:"-" db:"owner,omitempty"` // Red, Blue or Spymaster
>>>>>>> a7e599119b483ee253f7a53f21d0bedec0ea0192
	HasEnded           bool   `json:"hasEnded"`
	RedCardsRemaining  int    `json:"redCardsRemaining"`
	BlueCardsRemaining int    `json:"blueCardsRemaining"`
	Turn               string `json:"turn" db:"current_turn,omitempty"` // Red or Blue
	Streak             int    `json:"streak" db:"streak,omitempty"`
	Cards              []card `json:"cards"`
}

type connectionMap struct {
	sync.Map
}

var connections = &connectionMap{}

var db *sqlx.DB

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true }, // Allow all connections
}

// Retrieve the list of connections for a given game
func (cm *connectionMap) getConnectionList(gameID int64) ([]string, []*websocket.Conn, bool) {
	connectionList, loaded := (*cm).Load(gameID)
	if loaded {
		ownerList := connectionList.([]interface{})[0].([]string)
		socketList := connectionList.([]interface{})[1].([]*websocket.Conn)
		return ownerList, socketList, loaded
	}
	return nil, nil, loaded
}

// Remove element by index and returns back the modified slice
func (cm *connectionMap) removeOwnerFromList(connectionList []string, i int) []string {
	connectionList[i] = connectionList[len(connectionList)-1]
	return connectionList[:len(connectionList)-1]
}

// Remove element by index and returns back the modified slice
func (cm *connectionMap) removeSocketFromList(connectionList []*websocket.Conn, i int) []*websocket.Conn {
	connectionList[i] = connectionList[len(connectionList)-1]
	return connectionList[:len(connectionList)-1]
}

// Delete the given connection from our data structure
func (cm *connectionMap) deleteConnection(gameID int64, connection *websocket.Conn) {
	ownerList, socketList, loaded := (*cm).getConnectionList(gameID)
	fmt.Println("DEL===>", ownerList, socketList)
	// If found anything, delete the websocket and its associated owner from the list
	if loaded {
		fmt.Println("Found stuff")
		for i, actualConnection := range socketList {
			if actualConnection == connection {
				newOwners := (*cm).removeOwnerFromList(ownerList, i)
				newSockets := (*cm).removeSocketFromList(socketList, i)
				newVal := []interface{}{newOwners, newSockets}
				(*cm).Store(gameID, newVal)
				break
			}
		}
	}
}

// Adds a connection to the data structure
func (cm *connectionMap) addConnection(gameID int64, owner []string, sockets []*websocket.Conn) {
	val := []interface{}{owner, sockets}

	existingVal, loaded := (*cm).LoadOrStore(gameID, val)
	fmt.Println("ADD===>", existingVal, sockets)
	// If key already exists, append the current to the existing values
	if loaded {
		fmt.Println("Already exists")
		storedValueArr := existingVal.([]interface{})
		newOwners := append(storedValueArr[0].([]string), owner[0])
		newSockets := append(storedValueArr[1].([]*websocket.Conn), sockets[0])
		newVal := []interface{}{newOwners, newSockets}
		(*cm).Store(gameID, newVal)
	}
}

func (cm *connectionMap) showAll() {
	log.Println("\n=============")
	connections.Range(func(key interface{}, value interface{}) bool {
		log.Println("\nGameID:", key,
			"Owners:", value.([]interface{})[0].([]string),
			"Num Sockets:", len(value.([]interface{})[1].([]*websocket.Conn)))
		return true
	})
	log.Println("xxxxxxxxxxxxx\n")
}

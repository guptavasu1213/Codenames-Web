package main

import (
	"bufio"
	"log"
	"math/rand"
	"os"
	"time"

	"github.com/mattn/go-sqlite3"
)

// Functions related to database queries

func isUniqueViolation(err error) bool {
	if err, ok := err.(sqlite3.Error); ok {
		return err.Code == 19 && err.ExtendedCode == 2067
	}

	return false
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

	cardList = append(cardList, "Assasin")
	rand.Shuffle(len(cardList), func(i, j int) {
		cardList[i], cardList[j] = cardList[j], cardList[i]
	})
	return cardList
}

func createNewGame(redLink string, blueLink string, spyLink string) {
	wordList := createWordList()
	now := time.Now().Unix()

	randomNumber := rand.Intn(1)
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

	query := `INSERT INTO games (epoch, current_turn, streak) VALUES ($1, $2, $3)`
	result, err := db.Exec(query, now, first, 0)
	if err != nil {
		log.Fatalf("Unable to execute the query. %v", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Fatalf("no id. %v", err)
	}

	query = `INSERT INTO teams (game_id, team_code, owner, cards_remaining) VALUES ($1, $2, $3, $4)`
	result, err = db.Exec(query, id, redLink, "Red", red)
	if err != nil {
		log.Fatalf("Cannot add to list %v", err)
	}

	result, err = db.Exec(query, id, blueLink, "Blue", blue)
	if err != nil {
		log.Fatalf("Cannot add to list %v", err)
	}

	result, err = db.Exec(query, id, spyLink, "Spymaster", 0)
	if err != nil {
		log.Fatalf("Cannot add to list %v", err)
	}

	query = `INSERT INTO cards (game_id, card_number, label, owner, visibility) VALUES ($1, $2, $3, $4, $5)`
	for i := 0; i < 25; i++ {
		result, err = db.Exec(query, id, i+1, wordList[i], cardList[i], 0)
		if err != nil {
			log.Fatalf("Cannot add to list %v", err)
		}
	}
}

package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

type links struct {
	RedLink  string `json:"redLink"`
	BlueLink string `json:"blueLink"`
	SpyLink  string `json:"spyLink"`
}

func randomHex(n int) (string, error) {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func createLinks(w http.ResponseWriter, r *http.Request) {
	redLink, _ := randomHex(3)
	blueLink, _ := randomHex(3)
	spyLink, _ := randomHex(3)
	links := links{RedLink: redLink, BlueLink: blueLink, SpyLink: spyLink}
	json.NewEncoder(w).Encode(links)
}

func loggingMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.RequestURI)
		next.ServeHTTP(w, r)
	})
}

func catchAllHandler(w http.ResponseWriter, r *http.Request) {
	log.Println(r.RequestURI)
	http.Error(w, http.StatusText(http.StatusNotFound), http.StatusNotFound)
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/api/v1/joins", createLinks).Methods(http.MethodGet)

	// r.PathPrefix("/joins/{id}").Methods(http.MethodGet).HandlerFunc(showGamePage)
	r.PathPrefix("/").HandlerFunc(catchAllHandler)
	r.Use(loggingMiddleWare)
	log.Fatal(http.ListenAndServe("localhost:8000", r))
}

package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
)

var portNumber int
var databaseFilePath string

// Display usage on command line
func usage() {
	fmt.Fprintf(os.Stderr, "usage: %s [options]\n\nOptions:\n", path.Base(os.Args[0]))
	flag.PrintDefaults()
}

// Parse command line arguments
func parseFlags() {
	flag.Usage = usage
	flag.IntVar(&portNumber, "port", 8080, "port number for connection")
	flag.StringVar(&databaseFilePath, "dbPath", "records.db", "database file path")
	flag.Parse()
}

func loggingMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.URL.RequestURI(), r.Method)
		next.ServeHTTP(w, r)
	})
}

func main() {
	parseFlags()

	// Set up the Database
	var err error
	db, err = sqlx.Connect("sqlite3", databaseFilePath)
	defer db.Close()
	if err != nil {
		fmt.Fprintf(os.Stderr, "cannot connect to database: %v\n", err)
		os.Exit(1)
	}

	// Set up router and subrouter
	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api/v1").Subrouter()

	// API Endpoints
	apiRouter.Path("/create").Methods("POST").HandlerFunc(handleCreateGame)
	apiRouter.Path("/games/{game_id:[0-9a-zA-Z]{32}}").Methods("GET").HandlerFunc(handleJoinGame)

	// Serve files
	r.Path("/{game_id:[0-9a-zA-Z]{32}}").HandlerFunc(handleJoinPageServing)
	r.Path("/").HandlerFunc(handlerToRetrieveHomePage)
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("dist")))

	r.Use(loggingMiddleWare)
	fmt.Printf("listening on port :%d\n", portNumber)

	log.Fatal(http.ListenAndServe(":"+strconv.Itoa(portNumber), r))
}

package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"testing"

	"github.com/jmoiron/sqlx"
)

func TestHandlerToRetrieveHomePage(t *testing.T) {
	req := httptest.NewRequest("GET", "/", nil)

	w := httptest.NewRecorder()
	handler := http.HandlerFunc(handlerToRetrieveHomePage)

	handler.ServeHTTP(w, req)

	status := w.Code
	expected := http.StatusOK

	if status != expected {
		t.Errorf("Expected: %v, got %v", status, http.StatusOK)
	}

}

func TestHandleCreateGame(t *testing.T) {
	// Open a copy of database to test on
	var err error
	db, err = sqlx.Connect("sqlite3", "recordstest.db")
	defer db.Close()
	if err != nil {
		fmt.Fprintf(os.Stderr, "cannot connect to database: %v\n", err)
		t.Errorf("Cannot open the database %v", err)
	}
	req := httptest.NewRequest("POST", "/api/v1/games", nil)
	w := httptest.NewRecorder()
	handler := http.HandlerFunc(handleCreateGame)

	handler.ServeHTTP(w, req)

	status := w.Code
	expected := http.StatusOK

	if status != expected {
		t.Errorf("Expected: %v, got %v", expected, status)
	}

	// check 3 codes with valid [0-9a-zA-Z]+ form
	var codes links
	err = json.NewDecoder(w.Body).Decode(&codes)
	if err != nil {
		t.Errorf("Unable to decode the request body.  %v", err)
	}

	var alpha = regexp.MustCompile("[0-9a-zA-Z]+")
	if alpha.MatchString(codes.BlueCode) == false ||
		alpha.MatchString(codes.RedCode) == false ||
		alpha.MatchString(codes.SpyCode) == false {
		t.Errorf("Improper codes")
	}

}

func TestHandleJoinPageServing(t *testing.T) {
	var err error
	db, err = sqlx.Connect("sqlite3", "recordstest.db")
	defer db.Close()
	if err != nil {
		fmt.Fprintf(os.Stderr, "cannot connect to database: %v\n", err)
		t.Errorf("Cannot open the database %v", err)
	}
	req := httptest.NewRequest("GET", "/757efd", nil)
	w := httptest.NewRecorder()
	handler := http.HandlerFunc(handleJoinPageServing)

	handler.ServeHTTP(w, req)

	status := w.Code
	expected := http.StatusOK

	if status != expected {
		t.Errorf("Expected: %v, got %v", expected, status)
	}

}

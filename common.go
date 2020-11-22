package main

import "github.com/jmoiron/sqlx"

var db *sqlx.DB

type links struct {
	RedLink  string `json:"redLink"`
	BlueLink string `json:"blueLink"`
	SpyLink  string `json:"spyLink"`
}

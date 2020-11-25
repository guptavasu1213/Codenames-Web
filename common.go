package main

import "github.com/jmoiron/sqlx"

var db *sqlx.DB

type links struct {
	RedLink  string `json:"redLink"`
	BlueLink string `json:"blueLink"`
	SpyLink  string `json:"spyLink"`
}

type gameState struct {
	GameID   int64  `json:"-" db:"game_id,omitempty"`
	TeamCode string `json:"-" db:"team_code,omitempty"`
	Owner    string `json:"-" db:"owner,omitempty"`
	HasEnded bool   `json:"hasEnded"`
}

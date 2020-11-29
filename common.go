package main

import "github.com/jmoiron/sqlx"

var db *sqlx.DB

type links struct {
	RedCode  string `json:"redCode"`
	BlueCode string `json:"blueCode"`
	SpyCode  string `json:"spyCode"`
}

type card struct {
	Label   string `json:"label" db:"label,omitempty"`
	Visible bool   `json:"visible" db:"visibility,omitempty"`
	Owner   string `json:"owner" db:"owner,omitempty"`
}

type gameState struct {
	GameID             int64  `json:"-" db:"game_id,omitempty"`
	TeamCode           string `json:"-" db:"team_code,omitempty"`
	Owner              string `json:"-" db:"owner,omitempty"` // Red, Blue or Spymaster
	HasEnded           bool   `json:"hasEnded"`
	RedCardsRemaining  int    `json:"redCardsRemaining"`
	BlueCardsRemaining int    `json:"blueCardsRemaining"`
	Turn               string `json:"turn" db:"current_turn,omitempty"` // Red or Blue
	Streak             int    `json:"streak" db:"streak,omitempty"`
	Cards              []card `json:"cards"`
}

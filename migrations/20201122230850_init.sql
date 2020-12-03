-- +goose Up
-- +goose StatementBegin
SELECT 'up SQL query';

CREATE TABLE games (
       game_id INTEGER PRIMARY KEY,
       epoch INTEGER,
       current_turn text,
       streak INTEGER,
       has_ended INTEGER
);

CREATE TABLE teams (
       game_id INTEGER REFERENCES games(game_id)
		ON DELETE CASCADE
              ON UPDATE CASCADE,
       team_code text PRIMARY KEY,
       owner text,
       cards_remaining INTEGER
              
);

CREATE TABLE  cards (
       game_id INTEGER REFERENCES games(game_id)
		ON DELETE CASCADE
              ON UPDATE CASCADE,
       card_number INTEGER,
       label text,
       owner text,
       visibility INTEGER
              
);
				   
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';

DROP TABLE cards;
DROP TABLE teams;
DROP TABLE games;
-- +goose StatementEnd

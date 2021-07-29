package db

import (
	"context"
	"fmt"
	"os"

	"illusionman1212/twatter-go/utils"

	"github.com/jackc/pgx/v4/pgxpool"
)

const users_table = `CREATE TABLE IF NOT EXISTS users(
	id SERIAL PRIMARY KEY UNIQUE,
	username varchar(16) UNIQUE NOT NULL,
	display_name varchar(16) NOT NULL,
	email varchar UNIQUE NOT NULL,
	bio varchar(150) DEFAULT '',
	verified_email boolean NOT NULL DEFAULT false,
	birthday date,
	created_at timestamp NOT NULL DEFAULT now(),
	email_verification_token varchar DEFAULT NULL,
	finished_setup boolean NOT NULL DEFAULT false,
	password varchar NOT NULL,
	avatar_url varchar NOT NULL DEFAULT 'default_profile.svg',
	reset_password_token varchar(32) DEFAULT NULL,
	reset_password_token_expiration timestamp DEFAULT NULL,
	token_hash varchar(16) NOT NULL
);`

// TODO: there's still more field to add to the messages table
const messages_table = `CREATE TABLE IF NOT EXISTS messages(
	id BIGSERIAL PRIMARY KEY UNIQUE,
	user_id INTEGER REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	content varchar(1000) NOT NULL,
	created_at timestamp NOT NULL DEFAULT now(),
	deleted boolean NOT NULL DEFAULT false,
	deleted_at timestamp DEFAULT NULL
);`

// TODO: there's still some more fields but idk how to implement them yet
const posts_table = `CREATE TABLE IF NOT EXISTS posts(
	id BIGSERIAL PRIMARY KEY UNIQUE,
	user_id INTEGER REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	content varchar(128) NOT NULL,
	created_at timestamp NOT NULL DEFAULT now(),
	deleted boolean NOT NULL DEFAULT false,
	deleted_at timestamp DEFAULT NULL
);`

// TODO: not sure if i need a conversation table

var DBPool *pgxpool.Pool

func InitializeDB() {
	// url example postgres://user:password@host:port/database?sslmode=verify-full
	// url example postgres://username:password@localhost:5432/database_name
	var err error
	DBPool, err = pgxpool.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connect to database: %v", err)
		panic(err)
	}

	_, err = DBPool.Exec(context.Background(), users_table)
	utils.CheckError(err)
	_, err = DBPool.Exec(context.Background(), messages_table)
	utils.CheckError(err)
	_, err = DBPool.Exec(context.Background(), posts_table)
	utils.CheckError(err)
}

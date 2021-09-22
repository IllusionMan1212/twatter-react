package db

import (
	"context"
	"errors"
	"fmt"
	"illusionman1212/twatter-go/utils"
	"net"
	"os"
	"time"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/sony/sonyflake"
)

const users_table = `CREATE TABLE IF NOT EXISTS users(
	id BIGINT PRIMARY KEY UNIQUE,
	username varchar(16) UNIQUE NOT NULL,
	display_name varchar(16) NOT NULL,
	email varchar UNIQUE NOT NULL,
	bio varchar(150) DEFAULT '',
	verified_email boolean NOT NULL DEFAULT false,
	birthday date,
	created_at timestamp NOT NULL DEFAULT (now() at time zone 'utc'),
	email_verification_token varchar DEFAULT NULL,
	finished_setup boolean NOT NULL DEFAULT false,
	password varchar NOT NULL,
	avatar_url varchar NOT NULL DEFAULT 'default_profile.svg',
	reset_password_token varchar(32) DEFAULT NULL,
	reset_password_token_expiration timestamp DEFAULT NULL
);`

const conversations_table = `CREATE TABLE IF NOT EXISTS conversations(
	id BIGINT PRIMARY KEY UNIQUE,
	last_updated timestamp,
	created_at timestamp NOT NULL DEFAULT (now() at time zone 'utc'),
	members BIGINT[] NOT NULL,
	participants BIGINT[] NOT NULL
);`

const messages_table = `CREATE TABLE IF NOT EXISTS messages(
	id BIGINT PRIMARY KEY UNIQUE,
	author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
	conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE,
	content varchar NOT NULL,
	sent_time timestamp NOT NULL DEFAULT (now() at time zone 'utc'),
	read_by BIGINT[] NOT NULL,
	deleted boolean NOT NULL DEFAULT false
);`

const message_attachments_table = `CREATE TABLE IF NOT EXISTS message_attachments(
	message_id BIGINT NOT NULL, FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
	url varchar NOT NULL UNIQUE,
	type attachment_type NOT NULL,
	size attachment_size NOT NULL
);`

// TODO: (maybe a deleted field ???)
// NOTE: BIGSERIAL has a NOT NULL constraint by default, bigint is needed for the parent_id here
const posts_table = `CREATE TABLE IF NOT EXISTS posts(
	id BIGINT PRIMARY KEY UNIQUE,
	user_id BIGINT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	content varchar(128) NOT NULL,
	created_at timestamp NOT NULL DEFAULT (now() at time zone 'utc'),
	parent_id BIGINT, FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE CASCADE
);`

const likes_table = `CREATE TABLE IF NOT EXISTS likes(
	user_id BIGINT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	post_id BIGINT NOT NULL, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
	PRIMARY KEY (post_id, user_id)
)`

const attachment_size_type = `DO $$ BEGIN
	CREATE TYPE attachment_size AS ENUM('large', 'medium', 'small', 'thumbnail');
	EXCEPTION
	WHEN duplicate_object THEN NULL;
	END $$`

const attachment_type_type = `DO $$ BEGIN
	CREATE TYPE attachment_type AS ENUM('image', 'gif', 'video');
	EXCEPTION
	WHEN duplicate_object THEN NULL;
	END $$`

const attachments_table = `CREATE TABLE IF NOT EXISTS attachments(
	post_id BIGINT NOT NULL, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
	url varchar NOT NULL UNIQUE,
	type attachment_type NOT NULL,
	size attachment_size NOT NULL
)`

var DBPool *pgxpool.Pool
var Snowflake = sonyflake.NewSonyflake(sonyflake.Settings{
	StartTime: time.Date(2021, time.January, 1, 0, 0, 0, 0, time.UTC),
	MachineID: func() (uint16, error) {
		conn, err := net.Dial("udp", "8.8.8.8:80")
		if err != nil {
			return 0, err
		}
		defer conn.Close()

		addr := conn.LocalAddr().(*net.UDPAddr)

		machineID := uint16(addr.IP[2])<<8 + uint16(addr.IP[3])

		return machineID, nil
	},
})

func InitializeDB() error {
	// url example postgres://user:password@host:port/database?sslmode=verify-full
	// url example postgres://username:password@localhost:5432/database_name
	var err error
	DBPool, err = pgxpool.Connect(context.Background(), os.Getenv("DATABASE_URL"))
	if err != nil {
		return errors.New(fmt.Sprintf("Fatal error while connecting to database: %v", err))
	}

	if Snowflake == nil {
		return errors.New(fmt.Sprintf("Fatal error while initializing snowflake: %v", err))
	}

	_, err = DBPool.Exec(context.Background(), users_table)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), conversations_table)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), messages_table)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), posts_table)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), likes_table)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), attachment_size_type)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), attachment_type_type)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), attachments_table)
	utils.FatalError(err)
	_, err = DBPool.Exec(context.Background(), message_attachments_table)
	utils.FatalError(err)

	return nil
}

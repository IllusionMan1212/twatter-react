package redissession

import (
	"context"
	"encoding/gob"
	"illusionman1212/twatter-go/models"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/gorilla/sessions"
	"github.com/rbcervilla/redisstore/v8"
)

var globalStore redisstore.RedisStore

const cookie_name = "session"

func InitializeTypes() {
	gob.Register(&models.User{})
}

func Initialize() {
	db_num, err := strconv.Atoi(os.Getenv("REDIS_DB_NUM"))
	if err != nil {
		panic(err)
	}
	redisClient := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_HOST"), // e.g. localhost:6379
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       db_num,
	})

	err = redisClient.Ping(context.Background()).Err()
	if err != nil {
		panic(err)
	}

	store, err := redisstore.NewRedisStore(context.Background(), redisClient)
	if err != nil {
		panic(err)
	}

	var secure bool
	if env := os.Getenv("ENV"); env == "prod" {
		secure = true
	} else {
		secure = false
	}

	store.KeyPrefix("session_")
	store.Options(sessions.Options{
		Path:     "/",
		Domain:   os.Getenv("DOMAIN"),
		MaxAge:   int((time.Hour * 24 * 30 * 6).Seconds()), // 6 months
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
		HttpOnly: true,
	})

	globalStore = *store
}

func GetSession(req *http.Request) *sessions.Session {
	session, _ := globalStore.Get(req, cookie_name)
	return session
}

func SetSession(key string, value interface{}, req *http.Request, w http.ResponseWriter) error {
	session, _ := globalStore.Get(req, cookie_name)

	session.Values[key] = value

	err := session.Save(req, w)
	return err
}

package sessionstore

import (
	"encoding/gob"
	"illusionman1212/twatter-go/models"
	"net/http"
	"os"

	"github.com/gorilla/sessions"
)

var store = sessions.NewCookieStore([]byte(os.Getenv("SESSION_KEY")))

const cookie_name = "session"

func InitializeTypes() {
	gob.Register(&models.User{})
}

func GetSession(req *http.Request) *sessions.Session {
	session, _ := store.Get(req, cookie_name)
	return session
}

func SetSession(key string, value interface{}, req *http.Request, w http.ResponseWriter) error {
	session, _ := store.Get(req, cookie_name)

	session.Values[key] = value

	err := session.Save(req, w)
	return err
}

func SetSessionWithOptions(key string, value interface{}, req *http.Request, w http.ResponseWriter, options *sessions.Options) error {
	session, _ := store.Get(req, cookie_name)

	session.Values[key] = value
	session.Options = options

	err := session.Save(req, w)
	return err
}

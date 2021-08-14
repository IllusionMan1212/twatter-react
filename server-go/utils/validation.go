package utils

import (
	"errors"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/redissession"
	"net/http"
)

func ValidateSession(req *http.Request, w http.ResponseWriter) (*models.User, error) {
	session := redissession.GetSession(req)
	if session.IsNew {
		UnauthorizedWithJSON(w, `{
			"message": "Not authorized to perform this action",
			"status": 401,
			"success": false
		}`)
		return &models.User{}, errors.New("Unauthorized user")
	}

	sessionUser, ok := session.Values["user"].(*models.User)
	if !ok {
		UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": "401",
			"success": false
		}`)
		return &models.User{}, errors.New("Unauthorized user")
	}

	return sessionUser, nil
}

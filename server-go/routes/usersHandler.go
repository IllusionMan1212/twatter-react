package routes

import (
	"context"
	"encoding/json"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

func ValidateToken(w http.ResponseWriter, req *http.Request) {

}

func GetUserData(w http.ResponseWriter, req *http.Request) {

}

func validatePasswordResetToken(w http.ResponseWriter, req *http.Request) {

}

func Create(w http.ResponseWriter, req *http.Request) {
	user := &models.User{}
	err := json.NewDecoder(req.Body).Decode(&user)
	utils.CheckErrorAndRespond(err, w, http.StatusBadRequest)

	email := strings.ToLower(strings.TrimSpace(user.Email))
	username := strings.ToLower(strings.TrimSpace(user.Username))
	password := strings.TrimSpace(user.Password)
	confirmPassword := strings.TrimSpace(user.ConfirmPassword)

	if email == "" || username == "" || password == "" || confirmPassword == "" {
		utils.CheckErrorAndRespond(err, w, http.StatusBadRequest)
		return
	}

	if len(username) < 3 || len(username) > 16 {
		utils.CheckErrorAndRespond(err, w, http.StatusBadRequest)
		return
	}

	if len(password) < 8 {
		utils.CheckErrorAndRespond(err, w, http.StatusBadRequest)
		return
	}

	if password != confirmPassword {
		utils.CheckErrorAndRespond(err, w, http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	utils.CheckError(err)

	_, err = db.DBPool.Exec(context.Background(), `INSERT INTO users (username, password, email, display_name) VALUES ($1, $2, $3, $1);`, username, hashedPassword, email)
	utils.CheckError(err)
}

func Login(w http.ResponseWriter, req *http.Request) {

}

func InitialSetup(w http.ResponseWriter, req *http.Request) {

}

func ForgotPassword(w http.ResponseWriter, req *http.Request) {

}

func ResetPassword(w http.ResponseWriter, req *http.Request) {

}

func Logout(w http.ResponseWriter, req *http.Request) {

}

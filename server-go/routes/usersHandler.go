package routes

import (
	"context"
	"encoding/json"
	"fmt"
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
	creds := &models.RegisterCreds{}
	err := json.NewDecoder(req.Body).Decode(&creds)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "Internal server error, please try again later",
			"status": "500",
			"success": "false"
		}`)
		panic(err)
	}

	email := strings.ToLower(strings.TrimSpace(creds.Email))
	username := strings.ToLower(strings.TrimSpace(creds.Username))
	password := strings.TrimSpace(creds.Password)
	confirmPassword := strings.TrimSpace(creds.ConfirmPassword)

	if email == "" || username == "" || password == "" || confirmPassword == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	if len(username) < 3 || len(username) > 16 {
		utils.BadRequestWithJSON(w, `{
			"message": "Username must be between 3 and 16 characters",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	if len(password) < 8 {
		utils.BadRequestWithJSON(w, `{
			"message": "Password must be at least 8 characters",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	if password != confirmPassword {
		utils.BadRequestWithJSON(w, `{
			"message": "Passwords do not match",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "Internal server error, please try again later",
			"status": "500",
			"success": "false"
		}`)
		panic(err)
	}

	_, err = db.DBPool.Exec(context.Background(), `INSERT INTO users (username, password, email, display_name) VALUES ($1, $2, $3, $1);`, username, hashedPassword, email)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint \"users_username_key\"") {
			utils.ConflictWithJSON(w, `{
				"message": "Username already taken",
				"status": "409",
				"success": "false"
			}`)
			return
		} else if strings.Contains(err.Error(), "duplicate key value violates unique constraint \"users_email_key\"") {
			utils.ConflictWithJSON(w, `{
				"message": "Email already taken",
				"status": "409",
				"success": "false"
			}`)
			return
		}

		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error occurred while creating your account, please try again later",
			"status": "500",
			"success": "false"
		}`)
		panic(err)
	}
}

func Login(w http.ResponseWriter, req *http.Request) {
	creds := &models.LoginCreds{}
	err := json.NewDecoder(req.Body).Decode(&creds)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "Internal server error, please try again later",
			"status": "500",
			"success": "false"
		}`)
		panic(err)
	}

	credsUsername := strings.ToLower(strings.TrimSpace(creds.Username))
	credsPassword := strings.TrimSpace(creds.Password)
	stayLoggedIn := creds.StayLoggedIn
	// TODO: token

	if credsUsername == "" || credsPassword == "" || (stayLoggedIn && !stayLoggedIn) {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	user := &models.User{}
	var hash string

	// select the hash from the database
	fetchedUser := db.DBPool.QueryRow(context.Background(), `SELECT id, username, password, display_name, bio, birthday, createdat, finished_setup, avatar_url FROM users WHERE email = $1 OR username = $1;`, credsUsername)

	// scan the hash from the row into the hash var
	err = fetchedUser.Scan(&user.ID, &user.Username, &hash, &user.DisplayName, &user.Bio, &user.Birthday, &user.CreatedAt, &user.FinishedSetup, &user.AvatarURL)
	if err != nil {
		// if no returned then email/username is invalid
		if strings.Contains(err.Error(), "no rows") {
			utils.UnauthorizedWithJSON(w, `{
				"message": "Incorrect credentials",
				"status": "401",
				"success": "false"
			}`)
		} else {
			panic(err)
		}
		return
	}

	// compare the hash and the password and respond accordingly
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(credsPassword))
	if err != nil {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Incorrect credentials",
			"status": "401",
			"success": "false"
		}`)
		return
	}

	// marshal the user interface to a JSON and send the OK response
	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Logged in successfully",
		"status": "200",
		"success": "true",
		"user": %v 
	}`, utils.MarshalJSON(user)))
}

func InitialSetup(w http.ResponseWriter, req *http.Request) {

}

func ForgotPassword(w http.ResponseWriter, req *http.Request) {

}

func ResetPassword(w http.ResponseWriter, req *http.Request) {

}

func Logout(w http.ResponseWriter, req *http.Request) {

}

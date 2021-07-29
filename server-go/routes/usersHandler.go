package routes

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/sessionstore"
	"illusionman1212/twatter-go/utils"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/sessions"
	exifremove "github.com/scottleedavis/go-exif-remove"
	"golang.org/x/crypto/bcrypt"
)

const dateLayout = "2006-01-02"

func ValidateToken(w http.ResponseWriter, req *http.Request) {
	session := sessionstore.GetSession(req)

	if session.IsNew {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": "401",
			"success": false
		}`)
		return
	}

	sessionUser, ok := session.Values["user"].(*models.User)
	if !ok {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": "401",
			"success": false
		}`)
		return
	}

	user := &models.User{}

	// query the db for the user
	err := db.DBPool.QueryRow(context.Background(), `SELECT id, username, display_name, bio, birthday, created_at, finished_setup, avatar_url FROM users WHERE id = $1;`, sessionUser.ID).Scan(&user.ID, &user.Username, &user.DisplayName, &user.Bio, &user.Birthday, &user.CreatedAt, &user.FinishedSetup, &user.AvatarURL)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": "500",
			"success": false
		}`)
		panic(err)
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"status": "200",
		"success": "true",
		"user": %v 
	}`, utils.MarshalJSON(user)))
}

func GetUserData(w http.ResponseWriter, req *http.Request) {
	username := strings.ToLower(req.URL.Query().Get("username"))

	if username == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": "400",
			"success": false
		}`)
		return
	}

	user := &models.User{}

	err := db.DBPool.QueryRow(context.Background(), `SELECT id, username, display_name, bio, birthday, created_at, finished_setup, avatar_url FROM users WHERE username = $1;`, username).Scan(&user.ID, &user.Username, &user.DisplayName, &user.Bio, &user.Birthday, &user.CreatedAt, &user.FinishedSetup, &user.AvatarURL)

	if err != nil {
		fmt.Printf("%v\n", err)
		if err == sql.ErrNoRows {
			utils.NotFoundWithJSON(w, `{
				"message": "User not found",
				"status": "404",
				"success": false
			}`)
		} else {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": "500",
				"success": false
			}`)
			panic(err)
		}
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Retrieved user data successfully",
		"status": "200",
		"success": true,
		"user": %v
	}`, utils.MarshalJSON(user)))
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

	// lowercase email and username. and trim spaces from all
	email := strings.ToLower(strings.TrimSpace(creds.Email))
	username := strings.ToLower(strings.TrimSpace(creds.Username))
	password := strings.TrimSpace(creds.Password)
	confirmPassword := strings.TrimSpace(creds.ConfirmPassword)

	// if email or username is blank then return bad request
	if email == "" || username == "" || password == "" || confirmPassword == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	// if username is too short or too long return bad request
	if len(username) < 3 || len(username) > 16 {
		utils.BadRequestWithJSON(w, `{
			"message": "Username must be between 3 and 16 characters",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	// if password is too short return bad request
	if len(password) < 8 {
		utils.BadRequestWithJSON(w, `{
			"message": "Password must be at least 8 characters",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	// if password and confirm password don't match return bad request
	if password != confirmPassword {
		utils.BadRequestWithJSON(w, `{
			"message": "Passwords do not match",
			"status": "400",
			"success": "false"
		}`)
		return
	}

	// hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "Internal server error, please try again later",
			"status": "500",
			"success": "false"
		}`)
		panic(err)
	}

	// TODO: should i generate my own id for users or let the db incremental stuff do it?

	user := &models.User{}

	insertQuery := `INSERT INTO users (username, password, email, display_name)
	VALUES ($1, $2, $3, $1, $4)
	RETURNING id, username, display_name, bio, avatar_url, birthday, created_at, finished_setup;`

	// insert into the DB and scan the result into user
	err = db.DBPool.QueryRow(context.Background(), insertQuery, username, hashedPassword, email).Scan(&user.ID, &user.Username, &user.DisplayName, &user.Bio, &user.AvatarURL, &user.Birthday, &user.CreatedAt, &user.FinishedSetup)
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

	// set the session
	options := sessions.Options{
		Path:     "/",
		Domain:   os.Getenv("DOMAIN"),
		MaxAge:   0,
		Secure:   false, // TODO: change this in production
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
	err = sessionstore.SetSessionWithOptions("user", user, req, w, &options)
	if err != nil {
		panic(err)
	}

	// marshal the user interface to a JSON and send the OK response
	utils.OkWithJSON(w, `{
		"message": "Created an account successfully",
		"status": "200",
		"success": "true"
	}`)
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
	fetchedUser := db.DBPool.QueryRow(context.Background(), `SELECT id, username, password, display_name, bio, birthday, created_at, finished_setup, avatar_url FROM users WHERE email = $1 OR username = $1;`, credsUsername)

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

	// NOTE: ideally we'd want a session id to keep track of all the sessions on the server-
	// -when using a redis store. but for smaller stuff like this, a cookie store is fine
	// the cookie store basically maps out every device to a map of connected users.
	if stayLoggedIn {
		options := sessions.Options{
			Path:     "/",
			Domain:   os.Getenv("DOMAIN"),
			MaxAge:   int((time.Hour * 24 * 365).Seconds()), // 1 year
			Secure:   false,                                 // TODO: change this in production
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		}
		err = sessionstore.SetSessionWithOptions("user", user, req, w, &options)
		if err != nil {
			panic(err)
		}
	} else {
		options := sessions.Options{
			Path:     "/",
			Domain:   os.Getenv("DOMAIN"),
			MaxAge:   0,
			Secure:   false, // TODO: change this in production
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		}
		err = sessionstore.SetSessionWithOptions("user", user, req, w, &options)
		if err != nil {
			panic(err)
		}
	}

	// TODO: generate access token and refresh token

	// marshal the user interface to a JSON and send the OK response
	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Logged in successfully",
		"status": "200",
		"success": "true",
		"user": %v 
	}`, utils.MarshalJSON(user)))
}

func InitialSetup(w http.ResponseWriter, req *http.Request) {
	err := req.ParseMultipartForm(32 << 20) // 32 MB
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": "500",
			"success": "false"
		}`)
		panic(err)
	}

	bio := req.MultipartForm.Value["bio"][0]
	userID := req.MultipartForm.Value["userId"][0]
	birthdayYear := req.MultipartForm.Value["birthday_year"][0]
	birthdayMonth := req.MultipartForm.Value["birthday_month"][0]
	birthdayDay := req.MultipartForm.Value["birthday_day"][0]
	image := req.MultipartForm.File["profileImage"][0]

	if userID == "null" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": "400",
			"success": false
		}`)
		return
	}

	if len(bio) > 150 {
		utils.PayloadTooLargeWithJSON(w, `{
			"message": "Bio is too long, it cannot be longer than 150 characters",
			"status": "413",
			"success": false
		}`)
		return
	}

	if bio != "null" {
		db.DBPool.QueryRow(context.Background(), `UPDATE users SET bio = $1 WHERE id = $2;`, bio, userID)
	}

	if birthdayDay != "null" && birthdayMonth != "null" && birthdayYear != "null" {
		birthdayTime, err := time.Parse(dateLayout, fmt.Sprintf("%v-%v-%v", birthdayYear, birthdayMonth, birthdayDay))
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": "500",
				"success": false
			}`)
			panic(err)
		}
		birthday := sql.NullTime{Time: birthdayTime, Valid: true}

		db.DBPool.QueryRow(context.Background(), "UPDATE users SET birthday = $1 WHERE id = $2;", birthday, userID)
	}

	if image != nil {
		mimetype := image.Header.Get("Content-Type")
		if mimetype != "image/jpg" && mimetype != "image/jpeg" && mimetype != "image/png" && mimetype != "image/webp" {
			utils.BadRequestWithJSON(w, `{
				"message": "Invalid image type, only .jpg, .jpeg, .png, .webp are accepted",
				"status": "400",
				"success": false
			}`)
			return
		}

		imageContent, err := image.Open()
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": "500",
				"success": false
			}`)
			panic(err)
		}
		bytes, err := ioutil.ReadAll(imageContent)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": "500",
				"success": false
			}`)
			panic(err)
		}

		imageBytes := bytes

		// remove exif data from jpeg and jpg images
		if mimetype == "image/jpg" || mimetype == "image/jpeg" {
			imageBytes, err = exifremove.Remove(bytes)
			if err != nil {
				utils.InternalServerErrorWithJSON(w, `{
					"message": "An error has occurred, please try again later",
					"status": "500",
					"success": false
				}`)
				panic(err)
			}

		}
		extension := strings.Split(mimetype, "/")[1]
		fileDirectory := fmt.Sprintf("../cdn/profile_images/%s/", userID)
		err = os.Mkdir(fileDirectory, 0755)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": "500",
				"success": false
			}`)
			panic(err)
		}

		filePath := fmt.Sprintf("%s/profile.%s", fileDirectory, extension)

		file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": "500",
				"success": false
			}`)
			panic(err)
		}

		file.Write(imageBytes)

		avatar_url := fmt.Sprintf("%s/cdn/profile_images/%s/profile.%s", os.Getenv("API_DOMAIN_URL"), userID, extension)

		// TODO: compress the image and have multiple sizes

		db.DBPool.QueryRow(context.Background(), "UPDATE users SET avatar_url = $1 WHERE id = $2", avatar_url, userID)
	}

	db.DBPool.QueryRow(context.Background(), `UPDATE users SET finished_setup = true WHERE id = $1;`, userID)

	utils.OkWithJSON(w, `{
		"message": "Setup has been completed",
		"status": "200",
		"success": true
	}`)
}

func ForgotPassword(w http.ResponseWriter, req *http.Request) {

}

func ResetPassword(w http.ResponseWriter, req *http.Request) {

}

func Logout(w http.ResponseWriter, req *http.Request) {
	options := sessions.Options{
		Path:     "/",
		Domain:   os.Getenv("DOMAIN"),
		MaxAge:   -1,
		Secure:   false, // TODO: change this in production
		SameSite: http.SameSiteStrictMode,
		HttpOnly: true,
	}
	err := sessionstore.SetSessionWithOptions("user", nil, req, w, &options)
	if err != nil {
		panic(err)
	}

	utils.OkWithJSON(w, `{
		"message": "Logged out",
		"status": "200",
		"success": true
	}`)
}
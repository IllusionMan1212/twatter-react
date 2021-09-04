package routes

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/redissession"
	"illusionman1212/twatter-go/utils"
	"io/ioutil"
	"mime/multipart"
	"net/http"
	"net/mail"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/go-oss/image/imageutil"
	"github.com/jackc/pgx/v4"
	"golang.org/x/crypto/bcrypt"
)

const dateLayout = "2006-01-02"

func ValidateToken(w http.ResponseWriter, req *http.Request) {
	session := redissession.GetSession(req)

	if session.IsNew {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": 401,
			"success": false
		}`)
		return
	}

	sessionUser, ok := session.Values["user"].(*models.User)
	if !ok {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized user, please log in",
			"status": 401,
			"success": false
		}`)
		return
	}

	user := &models.User{}

	// query the db for the user
	err := db.DBPool.QueryRow(context.Background(), `SELECT id, username, display_name, bio, birthday, created_at, finished_setup, avatar_url FROM users WHERE id = $1;`,
		sessionUser.ID).Scan(&user.ID, &user.Username, &user.DisplayName, &user.Bio, &user.Birthday, &user.CreatedAt, &user.FinishedSetup, &user.AvatarURL)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"status": 200,
		"success": true,
		"user": %v 
	}`, utils.MarshalJSON(user)))
}

func GetUserData(w http.ResponseWriter, req *http.Request) {
	username := strings.ToLower(req.URL.Query().Get("username"))

	if username == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		return
	}

	user := &models.User{}

	err := db.DBPool.QueryRow(context.Background(), `SELECT id, username, display_name, bio, birthday, created_at, finished_setup, avatar_url FROM users WHERE username = $1;`, username).Scan(&user.ID, &user.Username, &user.DisplayName, &user.Bio, &user.Birthday, &user.CreatedAt, &user.FinishedSetup, &user.AvatarURL)

	if err != nil {
		if err == pgx.ErrNoRows {
			utils.NotFoundWithJSON(w, `{
				"message": "User not found",
				"status": 404,
				"success": false
			}`)
			return
		} else {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Retrieved user data successfully",
		"status": 200,
		"success": true,
		"user": %v
	}`, utils.MarshalJSON(user)))
}

func validatePasswordResetToken(w http.ResponseWriter, req *http.Request) {
	token := req.URL.Query().Get("token")

	if token == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		return
	}

	user := &models.User{}

	err := db.DBPool.QueryRow(context.Background(), `SELECT id, username, display_name, avatar_url FROM users WHERE reset_password_token = $1 AND reset_password_token_expiration > now();`, token).Scan(&user.ID, &user.Username, &user.DisplayName, &user.AvatarURL)
	if err != nil {
		if err == pgx.ErrNoRows {
			utils.ForbiddenWithJSON(w, `{
				"message": "Invalid or expired token",
				"status": 403,
				"success": false
			}`)
			return
		} else {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}
	}

	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Token validated",
		"status": 200,
		"success": true,
		"user": %v
	}`, utils.MarshalJSON(user)))
}

func Create(w http.ResponseWriter, req *http.Request) {
	creds := &models.RegisterCreds{}
	err := json.NewDecoder(req.Body).Decode(&creds)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Errorf("Error while decoding request body: ", err)
		return
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
			"status": 400,
			"success": false
		}`)
		return
	}

	// if username is too short or too long return bad request
	if len(username) < 3 || len(username) > 16 {
		utils.BadRequestWithJSON(w, `{
			"message": "Username must be between 3 and 16 characters",
			"status": 400,
			"success": false
		}`)
		return
	}

	// if password is too short return bad request
	if len(password) < 8 {
		utils.BadRequestWithJSON(w, `{
			"message": "Password must be at least 8 characters",
			"status": 400,
			"success": false
		}`)
		return
	}

	// if password and confirm password don't match return bad request
	if password != confirmPassword {
		utils.BadRequestWithJSON(w, `{
			"message": "Passwords do not match",
			"status": 400,
			"success": false
		}`)
		return
	}

	// hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "Internal server error, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	user := &models.User{}

	id, err := db.Snowflake.NextID()
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		logger.Errorf("Error while generating a new id: ", err)
		return
	}

	insertQuery := `INSERT INTO users (id, username, password, email, display_name)
	VALUES ($1, $2, $3, $4, $2)
	RETURNING id, username, display_name, bio, avatar_url, birthday, created_at, finished_setup;`

	// insert into the DB and scan the result into user
	err = db.DBPool.QueryRow(context.Background(), insertQuery, id, username, hashedPassword, email).Scan(&user.ID, &user.Username, &user.DisplayName, &user.Bio, &user.AvatarURL, &user.Birthday, &user.CreatedAt, &user.FinishedSetup)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint \"users_username_key\"") {
			utils.ConflictWithJSON(w, `{
				"message": "Username already taken",
				"status": 409,
				"success": false
			}`)
			return
		} else if strings.Contains(err.Error(), "duplicate key value violates unique constraint \"users_email_key\"") {
			utils.ConflictWithJSON(w, `{
				"message": "This email address is already associated with an account",
				"status": 409,
				"success": false
			}`)
			return
		}

		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error occurred while creating your account, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	// set the session
	err = redissession.SetSession("user", user, req, w)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	// marshal the user interface to a JSON and send the OK response
	utils.OkWithJSON(w, `{
		"message": "Created an account successfully",
		"status": 200,
		"success": "true"
	}`)
}

func Login(w http.ResponseWriter, req *http.Request) {
	creds := &models.LoginCreds{}
	err := json.NewDecoder(req.Body).Decode(&creds)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "Internal server error, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	credsUsername := strings.ToLower(strings.TrimSpace(creds.Username))
	credsPassword := strings.TrimSpace(creds.Password)
	stayLoggedIn := creds.StayLoggedIn

	if credsUsername == "" || credsPassword == "" || (stayLoggedIn && !stayLoggedIn) {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
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
				"status": 401,
				"success": false
			}`)
		} else {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
		}
		return
	}

	// compare the hash and the password and respond accordingly
	err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(credsPassword))
	if err != nil {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Incorrect credentials",
			"status": 401,
			"success": false
		}`)
		return
	}

	err = redissession.SetSession("user", user, req, w)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	// TODO: generate access token and refresh token

	// marshal the user interface to a JSON and send the OK response
	utils.OkWithJSON(w, fmt.Sprintf(`{
		"message": "Logged in successfully",
		"status": 200,
		"success": "true",
		"user": %v 
	}`, utils.MarshalJSON(user)))
}

func InitialSetup(w http.ResponseWriter, req *http.Request) {
	err := req.ParseMultipartForm(10 << 20) // 10 MB
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	bio := req.MultipartForm.Value["bio"][0]
	userID := req.MultipartForm.Value["userId"][0]
	birthdayYear := req.MultipartForm.Value["birthday_year"][0]
	birthdayMonth := req.MultipartForm.Value["birthday_month"][0]
	birthdayDay := req.MultipartForm.Value["birthday_day"][0]

	var image *multipart.FileHeader
	if req.MultipartForm.File["profileImage"] != nil {
		image = req.MultipartForm.File["profileImage"][0]
	}

	sessionUser, err := utils.ValidateSession(req, w)
	if err != nil {
		return
	}

	if userID != fmt.Sprintf("%v", sessionUser.ID) {
		utils.UnauthorizedWithJSON(w, `{
			"message": "Unauthorized to perform this action",
			"status": 401,
			"success": false
		}`)
		return
	}

	if userID == "null" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		return
	}

	if len(bio) > 150 {
		utils.PayloadTooLargeWithJSON(w, `{
			"message": "Bio is too long, it cannot be longer than 150 characters",
			"status": 413,
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
				"status": 500,
				"success": false
			}`)
			return
		}
		birthday := sql.NullTime{Time: birthdayTime, Valid: true}

		db.DBPool.QueryRow(context.Background(), "UPDATE users SET birthday = $1 WHERE id = $2;", birthday, userID)
	}

	if image != nil {
		mimetype := image.Header.Get("Content-Type")
		if !utils.AllowedProfileImageMimetypes[mimetype] {
			utils.BadRequestWithJSON(w, `{
				"message": "Invalid image type, only .jpg, .jpeg, .png, .webp are accepted",
				"status": 400,
				"success": false
			}`)
			return
		}

		if image.Size > utils.MaxFileSize {
			utils.BadRequestWithJSON(w, `{
				"message": "File size cannot exceed 8 MB",
				"status": 400,
				"success": false
			}`)
			return
		}

		imageContent, err := image.Open()
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}
		buf, err := ioutil.ReadAll(imageContent)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}

		imageBytes := buf

		// remove exif data from jpeg and jpg images
		if mimetype == "image/jpg" || mimetype == "image/jpeg" {
			r := bytes.NewReader(buf)
			reader, err := imageutil.RemoveExif(r)
			if err != nil {
				utils.InternalServerErrorWithJSON(w, `{
					"message": "An error has occurred, please try again later",
					"status": 500,
					"success": false
				}`)
				return
			}
			tempBuf := new(bytes.Buffer)
			_, err = tempBuf.ReadFrom(reader)
			if err != nil {
				utils.InternalServerErrorWithJSON(w, `{
					"message": "An error has occurred, please try again later",
					"status": 500,
					"success": false
				}`)
				return
			}
			imageBytes = tempBuf.Bytes()
		}
		extension := strings.Split(mimetype, "/")[1]
		fileDirectory := fmt.Sprintf("../cdn/profile_images/%s/", userID)
		err = os.Mkdir(fileDirectory, 0755)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}

		filePath := fmt.Sprintf("%s/profile.%s", fileDirectory, extension)

		file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}

		file.Write(imageBytes)

		avatar_url := fmt.Sprintf("%s/cdn/profile_images/%s/profile.%s", os.Getenv("API_DOMAIN_URL"), userID, extension)

		// TODO: compress the image and have multiple sizes

		db.DBPool.QueryRow(context.Background(), "UPDATE users SET avatar_url = $1 WHERE id = $2", avatar_url, userID)
	}

	db.DBPool.QueryRow(context.Background(), `UPDATE users SET finished_setup = true WHERE id = $1;`, userID)

	// TODO: return the user as well to use the frontend login() funcion so that the home page loads correctly
	utils.OkWithJSON(w, `{
		"message": "Setup has been completed",
		"status": 200,
		"success": true
	}`)
}

func ForgotPassword(w http.ResponseWriter, req *http.Request) {
	creds := &models.ForgotPasswordCreds{}
	err := json.NewDecoder(req.Body).Decode(&creds)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	email := strings.ToLower(strings.TrimSpace(creds.Email))

	if email == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		return
	}

	reset_token := utils.GenerateRandomBytes(32)

	user := models.User{}

	err = db.DBPool.QueryRow(context.Background(), `SELECT id FROM users WHERE email = $1`, email).Scan(&user.ID)
	if err != nil {
		if err == pgx.ErrNoRows {
			// respond with a 200 to prevent malicious parties from finding out which emails exist
			// NOTE: above comment means nothing since users can try to create accounts with emails that dont belong to them
			utils.OkWithJSON(w, `{
				"message": "An email containing instructions on how to reset your password has been sent to you",
				"status": 200,
				"success": true
			}`)
			return
		} else {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}
	}

	_, err = db.DBPool.Exec(context.Background(), `UPDATE users SET reset_password_token = $1, reset_password_token_expiration = $2 WHERE email = $3;`, reset_token, time.Now().Add(time.Hour), email)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	// send an email to the user with the reset token
	// Sender data.
	from := mail.Address{"Twatter Support", os.Getenv("SUPPORT_EMAIL")}
	password := os.Getenv("SUPPORT_EMAIL_PASSWORD")

	// Receiver email address.
	to := []string{
		email,
	}

	// smtp server configuration.
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	body := `<p>The password reset link you requested is ready. Please click on the link below to reset your password</p>
	<a href="https://` + os.Getenv("DOMAIN") + `/reset-password/` + reset_token + `">https://` + os.Getenv("DOMAIN") + `/reset-password/` + reset_token + `</a>
	<p><b>Note: This link expires in 1 hour</b></p>
	<p>If you did not request this link, ignore this email and your password will remain unchanged</p>`

	header := make(map[string]string)
	header["From"] = from.String()
	header["To"] = to[0]
	header["Subject"] = "Reset Password"
	header["MIME-Version"] = "1.0"
	header["Content-Type"] = "text/html; charset=UTF-8"
	header["Content-Transfer-Encoding"] = "base64"

	// Message.
	message := ""
	for k, v := range header {
		message += fmt.Sprintf("%s: %s\r\n", k, v)
	}
	message += "\r\n" + base64.StdEncoding.EncodeToString([]byte(body))

	// Authentication.
	auth := smtp.PlainAuth("", from.Address, password, smtpHost)

	// Sending email.
	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, from.Address, to, []byte(message))
	if err != nil {
		fmt.Println(err)
		return
	}

	utils.OkWithJSON(w, `{
		"message": "An email containing instructions on how to reset your password has been sent to you",
		"status": 200,
		"success": true
	}`)
}

func ResetPassword(w http.ResponseWriter, req *http.Request) {
	creds := &models.ResetPasswordCreds{}
	err := json.NewDecoder(req.Body).Decode(&creds)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	reset_token := strings.ToLower(strings.TrimSpace(creds.Token))
	password := strings.TrimSpace(creds.Password)
	password_confirmation := strings.TrimSpace(creds.ConfirmPassword)

	if reset_token == "" || password == "" || password_confirmation == "" {
		utils.BadRequestWithJSON(w, `{
			"message": "Invalid or incomplete request",
			"status": 400,
			"success": false
		}`)
		return
	}

	if password != password_confirmation {
		utils.BadRequestWithJSON(w, `{
			"message": "Passwords do not match",
			"status": 400,
			"success": false
		}`)
		return
	}

	if len(password) < 8 {
		utils.BadRequestWithJSON(w, `{
			"message": "Password must be at least 8 characters",
			"status": 400,
			"success": false
		}`)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	user := models.User{}

	err = db.DBPool.QueryRow(context.Background(), `UPDATE users SET password = $1 WHERE reset_password_token = $2 AND reset_password_token_expiration > now()`, string(hash), reset_token).Scan(&user.ID)
	if err != nil {
		if err == pgx.ErrNoRows {
			utils.BadRequestWithJSON(w, `{
				"message": "Invalid or expired token",
				"status": 400,
				"success": false
			}`)
			return
		} else {
			utils.InternalServerErrorWithJSON(w, `{
				"message": "An error has occurred, please try again later",
				"status": 500,
				"success": false
			}`)
			return
		}
	}

	utils.OkWithJSON(w, `{
		"message": "Password has been successfully reset",
		"status": 200,
		"success": true
	}`)
}

func Logout(w http.ResponseWriter, req *http.Request) {
	session := redissession.GetSession(req)
	if session.IsNew {
		utils.ForbiddenWithJSON(w, `{
			"message": "Invalid or expired token",
			"status": 403,
			"success": false
		}`)
		return
	}

	session.Options.MaxAge = -1
	err := session.Save(req, w)
	if err != nil {
		utils.InternalServerErrorWithJSON(w, `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`)
		return
	}

	utils.OkWithJSON(w, `{
		"message": "Logged out",
		"status": 200,
		"success": true
	}`)
}

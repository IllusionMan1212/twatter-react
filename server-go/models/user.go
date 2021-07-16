package models

type User struct {
	Username        string `json:"username", db:"username"`
	Password        string `json:"password", db:"password"`
	Email           string `json:"email", db:"email"`
	ConfirmPassword string `json:"confirm_password"`
}

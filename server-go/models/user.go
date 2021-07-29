package models

import "database/sql"

type RegisterCreds struct {
	Username        string `json:"username"`
	Password        string `json:"password"`
	Email           string `json:"email"`
	ConfirmPassword string `json:"confirm_password"`
}

type LoginCreds struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	StayLoggedIn bool   `json:"stayLoggedIn"`
}

type ForgotPasswordCreds struct {
	Email string `json:"email"`
}

type ResetPasswordCreds struct {
	Token           string `json:"token"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
}

type User struct {
	ID            int64        `json:"id" db:"id"`
	Username      string       `json:"username" db:"username"`
	DisplayName   string       `json:"display_name" db:"display_name"`
	Bio           string       `json:"bio" db:"bio"`
	AvatarURL     string       `json:"avatar_url" db:"avatar_url"`
	Birthday      sql.NullTime `json:"birthday" db:"birthday"`
	CreatedAt     sql.NullTime `json:"created_at" db:"created_at"`
	FinishedSetup bool         `json:"finished_setup" db:"finished_setup"`
}

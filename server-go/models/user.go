package models

import (
	"database/sql"
	"time"
)

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
	ID            uint64       `json:"id"`
	Username      string       `json:"username"`
	DisplayName   string       `json:"display_name"`
	Bio           string       `json:"bio"`
	AvatarURL     string       `json:"avatar_url"`
	Birthday      sql.NullTime `json:"birthday"`
	CreatedAt     time.Time    `json:"created_at"`
	FinishedSetup bool         `json:"finished_setup"`
}

type ParentUser struct {
	ID            sql.NullInt64  `json:"id"`
	Username      sql.NullString `json:"username"`
	DisplayName   sql.NullString `json:"display_name"`
	Bio           sql.NullString `json:"bio"`
	AvatarURL     sql.NullString `json:"avatar_url"`
	Birthday      sql.NullTime   `json:"birthday"`
	CreatedAt     sql.NullTime   `json:"created_at"`
	FinishedSetup sql.NullBool   `json:"finished_setup"`
}

type Birthday struct {
	Year  int `json:"year"`
	Month int `json:"month"`
	Day   int `json:"day"`
}

type ProfileValues struct {
	UserID       uint64           `json:"userId"`
	DisplayName  string           `json:"displayName"`
	ProfileImage SocketAttachment `json:"profileImage"`
	Bio          string           `json:"bio"`
	Birthday     Birthday         `json:"birthday"`
}

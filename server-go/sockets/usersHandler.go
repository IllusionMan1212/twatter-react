package sockets

import (
	"context"
	"encoding/base64"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/functions"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
)

func UpdateProfile(socketMessage *models.SocketMessage, clients []*Client) {
	profile := &models.ProfileValues{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketMessage.Data)), profile)

	if profile.UserID == 0 {
		// TODO: throw an error
		panic("no user")
	}

	if profile.Bio != "" {
		query := `UPDATE users SET bio = $1 WHERE id = $2;`
		_, err := db.DBPool.Exec(context.Background(), query, profile.Bio, profile.UserID)
		if err != nil {
			// TODO: handle error
			panic(err)
		}
	}

	if profile.DisplayName != "" {
		query := `UPDATE users SET display_name = $1 WHERE id = $2;`
		_, err := db.DBPool.Exec(context.Background(), query, profile.DisplayName, profile.UserID)
		if err != nil {
			// TODO: handle err
			panic(err)
		}
	}

	if profile.ProfileImage.Data != "" {
		if !utils.AllowedProfileImageMimetypes[profile.ProfileImage.Mimetype] {
			// TODO: throw an error
			panic("unsupported file format")
		}

		buf, err := base64.StdEncoding.DecodeString(profile.ProfileImage.Data)
		if err != nil {
			panic(err)
		}

		functions.WriteProfileImage(profile.ProfileImage.Mimetype, profile.UserID, buf)
	}

	isBirthdayValid := profile.Birthday.Day != 1 && profile.Birthday.Month != 1 && profile.Birthday.Year != 1

	if isBirthdayValid {
		birthday := fmt.Sprintf("%v-%v-%v", profile.Birthday.Year, profile.Birthday.Month, profile.Birthday.Day)

		query := `UPDATE users SET birthday = $1 WHERE id = $2;`
		_, err := db.DBPool.Exec(context.Background(), query, birthday, profile.UserID)
		if err != nil {
			// TODO: handle error
			panic(err)
		}
	}

	dataToBeReturned := fmt.Sprintf(`{
		"eventType": "updateProfile",
		"data": {
			"userId": "%v",
			"displayName": "%v",
			"bio": "%v",
			"profileImage": "%v",
			"birthday": {
				"Time": "%v-%v-%v",
				"Valid": %v
			}
		}
	}`, profile.UserID,
		profile.DisplayName,
		profile.Bio,
		profile.ProfileImage.Data,
		profile.Birthday.Year, profile.Birthday.Month, profile.Birthday.Day,
		isBirthdayValid)

	for _, client := range clients {
		client.send <- []byte(dataToBeReturned)
	}
}

func RemoveBirthday(socketMessage *models.SocketMessage, clients []*Client) {
	user := &models.User{}

	// NOTE: this looks disgusting topkek
	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketMessage.Data)), user)

	db.DBPool.QueryRow(context.Background(), "UPDATE users SET birthday = null WHERE id = $1;", user.ID)

	payload := fmt.Sprintf(`{
		"eventType": "birthdayRemoved",
		"data": {
			"id": "%v"
		}
	}`, user.ID)

	for _, client := range clients {
		client.send <- []byte(payload)
	}
}

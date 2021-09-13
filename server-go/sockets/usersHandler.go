package sockets

import (
	"context"
	"encoding/base64"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/functions"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"time"
)

const dateLayout = "2006-01-02"

func UpdateProfile(socketPayload *models.SocketPayload, invokingClient *Client) {
	profile := &models.ProfileValues{}

	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), profile)

	if profile.UserID == "" {
		sendGenericSocketErr(invokingClient)
		logger.Error("No user id was sent when updating profile")
		return
	}

	if profile.Bio != "" {
		query := `UPDATE users SET bio = $1 WHERE id = $2;`
		_, err := db.DBPool.Exec(context.Background(), query, profile.Bio, profile.UserID)

		if err != nil {
			sendGenericSocketErr(invokingClient)
			logger.Errorf("Error while updating user's bio: %v", err)
			return
		}
	}

	if profile.DisplayName != "" {
		query := `UPDATE users SET display_name = $1 WHERE id = $2;`
		_, err := db.DBPool.Exec(context.Background(), query, profile.DisplayName, profile.UserID)
		if err != nil {
			sendGenericSocketErr(invokingClient)
			logger.Errorf("Error while updating user's display name: %v", err)
			return
		}
	}

	if profile.ProfileImage.Data != "" {
		if !utils.AllowedProfileImageMimetypes[profile.ProfileImage.Mimetype] {
			errPayload := `{
				"eventType": "error",
				"data": {
					"message": "Unsupported file format"
				}
			}`
			invokingClient.emitEvent([]byte(errPayload))
			logger.Error("Unsupported file format")
			return
		}

		buf, err := base64.StdEncoding.DecodeString(profile.ProfileImage.Data)
		if err != nil {
			sendGenericSocketErr(invokingClient)
			logger.Errorf("Error while decoding base64 string: %v", err)
			return
		}

		err = functions.WriteProfileImage(profile.ProfileImage.Mimetype, profile.UserID, buf)
		if err != nil {
			sendGenericSocketErr(invokingClient)
			logger.Errorf("Error while writing profile image: %v", err)
			return
		}
	}

	isBirthdayValid := profile.Birthday.Year != 1 && profile.Birthday.Month != 1 && profile.Birthday.Day != 1

	if isBirthdayValid {
		birthday := fmt.Sprintf("%v-%v-%v", profile.Birthday.Year, profile.Birthday.Month, profile.Birthday.Day)

		query := `UPDATE users SET birthday = $1 WHERE id = $2;`
		_, err := db.DBPool.Exec(context.Background(), query, birthday, profile.UserID)
		if err != nil {
			sendGenericSocketErr(invokingClient)
			logger.Errorf("Error while updating user's birthday: %v", err)
			return
		}
	}

	payload := &models.SocketPayload{}
	dataPayload := &models.UpdateProfileReturnPayload{}

	day := fmt.Sprintf("%v", profile.Birthday.Day)
	month := fmt.Sprintf("%v", profile.Birthday.Month)
	year := fmt.Sprintf("%v", profile.Birthday.Year)

	if profile.Birthday.Day < 10 {
		day = "0" + day
	}

	if profile.Birthday.Month < 10 {
		month = "0" + month
	}

	birthdayString := year + "-" + month + "-" + day

	birthday, err := time.Parse(dateLayout, birthdayString)
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while parsing date: %v", err)
		return
	}

	dataPayload.UserID = fmt.Sprintf("%v", profile.UserID)
	dataPayload.DisplayName = profile.DisplayName
	dataPayload.Bio = profile.Bio
	dataPayload.ProfileImage = profile.ProfileImage.Data
	dataPayload.Birthday.Time = birthday
	dataPayload.Birthday.Valid = isBirthdayValid

	payload.EventType = "updateProfile"
	payload.Data = dataPayload

	invokingClient.emitEvent([]byte(utils.MarshalJSON(payload)))
}

func RemoveBirthday(socketPayload *models.SocketPayload, invokingClient *Client) {
	user := &models.User{}

	// NOTE: this looks disgusting topkek
	utils.UnmarshalJSON([]byte(utils.MarshalJSON(socketPayload.Data)), user)

	_, err := db.DBPool.Exec(context.Background(), "UPDATE users SET birthday = null WHERE id = $1;", user.ID)
	if err != nil {
		sendGenericSocketErr(invokingClient)
		logger.Errorf("Error while removing user's birthday: %v", err)
		return
	}

	payload := &models.SocketPayload{}
	dataPayload := &models.RemoveBirthdayReturnPayload{}

	dataPayload.ID = user.ID

	payload.EventType = "birthdayRemoved"
	payload.Data = dataPayload

	invokingClient.emitEvent([]byte(utils.MarshalJSON(payload)))
}

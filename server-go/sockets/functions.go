package sockets

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"os"
	"strings"

	"github.com/go-oss/image/imageutil"
)

func writeAttachmentsFiles(attachments []models.SocketAttachment, postId uint64, clients []*Client) ([]models.Attachment, error) {
	returnedAttachments := make([]models.Attachment, 0)

	// write the attachments to files
	for i, attachment := range attachments {
		buf, err := base64.StdEncoding.DecodeString(attachment.Data)
		if err != nil {
			panic(err)
		}

		if len(buf) > utils.MaxFileSize {
			errPayload := `{
				"eventType": "postError",
				"data": {
						"message": "File size cannot exceed 8 mb"
				}
			}
			`
			for _, client := range clients {
				client.emitEvent([]byte(errPayload))
			}
			return []models.Attachment{}, errors.New("File size cannot exceed 8mb")
		}

		var imageBytes []byte
		mimetype := attachment.Mimetype

		imageBytes = buf

		mimetypeSlice := strings.Split(mimetype, "/")
		attachmentMimetype := mimetypeSlice[0]
		extension := mimetypeSlice[1]

		var attachmentType string

		if attachmentMimetype == "image" {
			if extension == "gif" {
				attachmentType = "gif"
			} else {
				attachmentType = "image"
			}
		} else if attachmentMimetype == "video" {
			attachmentType = "video"
		} else {
			errPayload := `{
				"eventType": "postError",
				"data": {
					"message": "Unsupported file format"
				}
			}`
			for _, client := range clients {
				client.emitEvent([]byte(errPayload))
			}
			return []models.Attachment{}, errors.New("Unsupported file format")
		}

		if mimetype == "image/jpg" || mimetype == "image/jpeg" {
			r := bytes.NewReader(buf)
			reader, err := imageutil.RemoveExif(r)
			if err != nil {
				panic(err)
			}
			tempBuf := new(bytes.Buffer)
			tempBuf.ReadFrom(reader)
			imageBytes = tempBuf.Bytes()
		}

		fileDirectory := fmt.Sprintf("../cdn/posts/%v/", postId)
		if i == 0 {
			err = os.Mkdir(fileDirectory, 0755)
			if err != nil {
				errPayload := `{
					"eventType": "postError",
					"data": {
						"message": "An error has occurred"
					}
				}
				`
				for _, client := range clients {
					client.emitEvent([]byte(errPayload))
				}
				return []models.Attachment{}, errors.New("An error has occurred")
			}
		}

		filePath := fmt.Sprintf("%s/%v.%s", fileDirectory, i+1, extension)

		file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}
		`
			for _, client := range clients {
				client.emitEvent([]byte(errPayload))
			}
			return []models.Attachment{}, errors.New("An error has occurred")
		}

		insertQuery := `INSERT INTO attachments(post_id, url, type, size)
		VALUES($1, $2, $3, $4)`

		attachmentUrl := fmt.Sprintf("%s/cdn/posts/%v/%v.%s",
			os.Getenv("API_DOMAIN_URL"),
			postId,
			i+1,
			extension)

		_, err = db.DBPool.Exec(context.Background(), insertQuery, postId, attachmentUrl, attachmentType, models.Large)
		if err != nil {
			errPayload := `{
			"eventType": "postError",
			"data": {
				"message": "An error has occurred, please try again later"
			}
		}
		`
			for _, client := range clients {
				client.emitEvent([]byte(errPayload))
			}
			return []models.Attachment{}, errors.New("An error has occurred")
		}

		returnedAttachment := &models.Attachment{}
		returnedAttachment.Type = attachmentType
		returnedAttachment.Url = attachmentUrl

		returnedAttachments = append(returnedAttachments, *returnedAttachment)
		file.Write(imageBytes)
	}

	return returnedAttachments, nil
}

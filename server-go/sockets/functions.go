package sockets

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/models"
	"illusionman1212/twatter-go/utils"
	"os"
	"strings"

	"github.com/go-oss/image/imageutil"
)

func writePostAttachmentsFiles(attachments []models.SocketAttachment, postId uint64) ([]models.Attachment, error) {
	returnedAttachments := make([]models.Attachment, 0)

	// write the attachments to files
	for i, attachment := range attachments {
		buf, err := base64.StdEncoding.DecodeString(attachment.Data)
		if err != nil {
			logger.Errorf("Error while decoding base64 string: %v", err)
			return []models.Attachment{}, errors.New("An error has occurred, please try again later")
		}

		if len(buf) > utils.MaxFileSize {
			logger.Error("File size cannot exceed 8mb")
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
			logger.Error("Unsupported file format")
			return []models.Attachment{}, errors.New("Unsupported file format")
		}

		if mimetype == "image/jpg" || mimetype == "image/jpeg" {
			r := bytes.NewReader(buf)
			reader, err := imageutil.RemoveExif(r)
			if err != nil {
				logger.Errorf("Failed to remove exif data from image: %v", err)
				return []models.Attachment{}, errors.New("An error has occurred, please try again")
			}
			tempBuf := new(bytes.Buffer)
			tempBuf.ReadFrom(reader)
			imageBytes = tempBuf.Bytes()
		}

		fileDirectory := fmt.Sprintf("../cdn/posts/%v/", postId)
		if i == 0 {
			err = os.Mkdir(fileDirectory, 0755)
			if err != nil {
				logger.Errorf("Error while creating directory for post attachment(s): %v", err)
				return []models.Attachment{}, errors.New("An error has occurred, please try again later")
			}
		}

		filePath := fmt.Sprintf("%s/%v.%s", fileDirectory, i+1, extension)

		file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
		if err != nil {
			logger.Errorf("Error while creating a new file for post attachment: %v", err)
			return []models.Attachment{}, errors.New("An error has occurred, please try again later")
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
			logger.Errorf("Error while inserting into attachments table: %v", err)
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

func writeMessageAttachmentFile(attachment models.SocketAttachment, messageId uint64, conversationId string) (models.Attachment, error) {
	if attachment.Data == "" {
		return models.Attachment{}, nil
	}

	buf, err := base64.StdEncoding.DecodeString(attachment.Data)
	if err != nil {
		logger.Errorf("Error while decoding base64 string: %v", err)
		return models.Attachment{}, errors.New("An error has occurred, please try again later")
	}

	if len(buf) > utils.MaxFileSize {
		logger.Error("File size cannot exceed 8mb")
		return models.Attachment{}, errors.New("File size cannot exceed 8mb")
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
		logger.Error("Unsupported file format")
		return models.Attachment{}, errors.New("Unsupported file format")
	}

	if mimetype == "image/jpg" || mimetype == "image/jpeg" {
		r := bytes.NewReader(buf)
		reader, err := imageutil.RemoveExif(r)
		if err != nil {
			logger.Errorf("Failed to remove exif data from image: %v", err)
			return models.Attachment{}, errors.New("An error has occurred, please try again")
		}
		tempBuf := new(bytes.Buffer)
		tempBuf.ReadFrom(reader)
		imageBytes = tempBuf.Bytes()
	}

	fileDirectory := fmt.Sprintf("../cdn/messages/%s/%v/", conversationId, messageId)
	err = os.MkdirAll(fileDirectory, 0755)
	if err != nil {
		logger.Errorf("Error while creating directory for post attachment(s): %v", err)
		return models.Attachment{}, errors.New("An error has occurred, please try again later")
	}

	filePath := fmt.Sprintf("%s/1.%s", fileDirectory, extension)

	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		logger.Errorf("Error while creating a new file for post attachment: %v", err)
		return models.Attachment{}, errors.New("An error has occurred, please try again later")
	}

	insertMessageAttachmentQuery := `INSERT INTO message_attachments(message_id, url, type, size)
		VALUES($1, $2, $3, $4);`

	attachmentUrl := fmt.Sprintf("%s/cdn/messages/%s/%v/1.%s",
		os.Getenv("API_DOMAIN_URL"),
		conversationId,
		messageId,
		extension)

	_, err = db.DBPool.Exec(context.Background(), insertMessageAttachmentQuery, messageId, attachmentUrl, attachmentType, models.Large)
	if err != nil {
		logger.Errorf("Error while inserting a message attachment into DB: %v", err)
		return models.Attachment{}, errors.New("An error has occurred, please try again later")
	}

	returnedAttachment := &models.Attachment{}
	returnedAttachment.Type = attachmentType
	returnedAttachment.Url = attachmentUrl

	file.Write(imageBytes)

	return *returnedAttachment, nil
}

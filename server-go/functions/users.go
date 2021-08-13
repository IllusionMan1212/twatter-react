package functions

import (
	"bytes"
	"context"
	"fmt"
	"illusionman1212/twatter-go/db"
	"os"
	"strings"

	"github.com/go-oss/image/imageutil"
)

func WriteProfileImage(mimetype string, userID uint64, buf []byte) {
	var imageBytes []byte

	imageBytes = buf

	extension := strings.Split(mimetype, "/")[1]

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

	fileDirectory := fmt.Sprintf("../cdn/profile_images/%v/", userID)
	err := os.Mkdir(fileDirectory, 0755)
	if err != nil {
		// TODO: figure out how to throw an err here, maybe throw separate errors for socket and http
	}

	filePath := fmt.Sprintf("%s/profile.%s", fileDirectory, extension)

	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		// TODO: return error here somehow
		panic(err)
	}

	avatar_url := fmt.Sprintf("%s/cdn/profile_images/%v/profile.%s", os.Getenv("API_DOMAIN_URL"), userID, extension)

	_, err = db.DBPool.Exec(context.Background(), "UPDATE users SET avatar_url = $1 WHERE id = $2", avatar_url, userID)
	if err != nil {
		// TODO: return error
		panic(err)
	}

	file.Write(imageBytes)
}

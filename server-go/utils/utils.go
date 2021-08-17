package utils

import (
	"encoding/hex"
	"encoding/json"
	"math/rand"
	"time"
)

var AllowedProfileImageMimetypes = map[string]bool{"image/png": true, "image/jpeg": true, "image/jpg": true, "image/webp": true}

const MaxFileSize = 8 * 1024 * 1024

func CheckError(err error) {
	if err != nil {
		panic(err)
	}
}

func MarshalJSON(v interface{}) string {
	b, err := json.Marshal(v)
	CheckError(err)
	return string(b)
}

func UnmarshalJSON(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

func GenerateRandomBytes(n int) string {
	b := make([]byte, n/2)
	rand.Seed(time.Now().UnixNano())
	rand.Read(b)
	return hex.EncodeToString(b)
}

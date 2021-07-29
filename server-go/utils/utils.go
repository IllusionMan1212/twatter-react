package utils

import (
	"encoding/hex"
	"encoding/json"
	"math/rand"
	"time"
)

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

func GenerateRandomBytes(n int) string {
	b := make([]byte, n/2)
	rand.Seed(time.Now().UnixNano())
	rand.Read(b)
	return hex.EncodeToString(b)
}

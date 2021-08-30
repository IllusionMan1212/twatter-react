package utils

import (
	"encoding/hex"
	"encoding/json"
	"log"
	"math/rand"
	"time"
)

func FatalError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func MarshalJSON(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		log.Panicf("Failed to marshal JSON: %v", err)
	}
	return string(b)
}

func UnmarshalJSON(data []byte, v interface{}) {
	err := json.Unmarshal(data, v)
	if err != nil {
		log.Panicf("Failed to unmarshal JSON: %v", err)
	}
}

func GenerateRandomBytes(n int) string {
	b := make([]byte, n/2)
	rand.Seed(time.Now().UnixNano())
	rand.Read(b)
	return hex.EncodeToString(b)
}

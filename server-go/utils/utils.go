package utils

import (
	"encoding/hex"
	"encoding/json"
	"illusionman1212/twatter-go/logger"
	"math/rand"
	"reflect"
	"time"
)

func FatalError(err error) {
	if err != nil {
		logger.Fatal(err)
	}
}

func MarshalJSON(v interface{}) string {
	b, err := json.Marshal(v)
	if err != nil {
		logger.Errorf("Failed to marshal JSON: %v", err)
	}
	return string(b)
}

func UnmarshalJSON(data []byte, v interface{}) {
	err := json.Unmarshal(data, v)
	if err != nil {
		logger.Errorf("Failed to unmarshal JSON: %s", err)
	}
}

func GenerateRandomBytes(n int) string {
	b := make([]byte, n/2)
	rand.Seed(time.Now().UnixNano())
	rand.Read(b)
	return hex.EncodeToString(b)
}

func Contains(slice interface{}, element interface{}) bool {
	sv := reflect.ValueOf(slice)

	for i := 0; i < sv.Len(); i++ {
		if sv.Index(i).Interface() == element {
			return true
		}
	}
	return false
}

package utils

import (
	"encoding/json"
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

package utils

import "net/http"

func CheckError(err error) {
	if err != nil {
		panic(err)
	}
}

func CheckErrorAndRespond(err error, w http.ResponseWriter, status int) {
	if err != nil {
		w.WriteHeader(status)
	}
}

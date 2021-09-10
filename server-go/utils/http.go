package utils

import (
	"fmt"
	"net/http"
)

// HTTP 200
func OkWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(json))
}

// HTTP 400
func BadRequestWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)
	w.Write([]byte(json))
}

// HTTP 401
func UnauthorizedWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(json))
}

// HTTP 403
func ForbiddenWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	w.Write([]byte(json))
}

// HTTP 404
func NotFoundWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte(json))
}

// HTTP 409
func ConflictWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusConflict)
	w.Write([]byte(json))
}

// HTTP 413
func PayloadTooLargeWithJSON(w http.ResponseWriter, json string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusRequestEntityTooLarge)
	w.Write([]byte(json))
}

// HTTP 500
func InternalServerErrorWithJSON(w http.ResponseWriter, errMessage string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	var json string
	if errMessage != "" {
		json = fmt.Sprintf(`{
			"message": "%v",
			"status": 500,
			"success": false
		}`, errMessage)
	} else {
		json = `{
			"message": "An error has occurred, please try again later",
			"status": 500,
			"success": false
		}`
	}
	w.Write([]byte(json))
}

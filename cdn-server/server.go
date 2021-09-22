package main

import (
	"fmt"
	"github.com/illusionman1212/twatter-go/logger"
	"github.com/illusionman1212/twatter-go/routes"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		logger.Fatal(err)
	}

	cors := cors.New(cors.Options{
		AllowedOrigins:   []string{os.Getenv("ALLOWED_ORIGINS")},
		AllowedMethods:   []string{"GET", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept"},
		ExposedHeaders:   []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
	})

	router := mux.NewRouter().StrictSlash(true)
	routes.RegisterCdnRoutes(router) // no validation required

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Infof("Listening on port %v", port)
	http.ListenAndServe(fmt.Sprintf(":%v", port), cors.Handler(router))
}

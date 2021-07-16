package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/routes"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}
	db.InitializeDB()

	cors := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE, OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept"},
		ExposedHeaders:   []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
	})

	router := mux.NewRouter().StrictSlash(true)
	cdnSubrouter := router.PathPrefix("/cdn/").Subrouter()
	apiSubrouter := router.PathPrefix("/api/").Subrouter()
	routes.RegisterUsersRoutes(apiSubrouter)
	routes.RegisterMessagingRoutes(apiSubrouter)
	routes.RegisterPostsRoutes(apiSubrouter)
	routes.RegisterCdnRoutes(cdnSubrouter)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Listening on port %v\n", port)
	http.ListenAndServe(fmt.Sprintf(":%v", port), cors.Handler(router))

	defer db.DBPool.Close()
}

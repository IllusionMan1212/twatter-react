package main

import (
	"fmt"
	"net/http"
	"os"

	"illusionman1212/twatter-go/db"
	"illusionman1212/twatter-go/logger"
	"illusionman1212/twatter-go/redissession"
	"illusionman1212/twatter-go/routes"
	"illusionman1212/twatter-go/sockets"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		logger.Fatal(err)
	}

	logger.Initialize()

	err = db.InitializeDB()
	if err != nil {
		logger.Fatal(err)
	}

	redissession.InitializeTypes()
	err = redissession.Initialize()
	if err != nil {
		logger.Fatal(err)
	}

	hub := sockets.NewHub()
	go hub.Run()

	cors := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://192.168.119.4:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Origin", "Content-Type", "Accept"},
		ExposedHeaders:   []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
	})

	router := mux.NewRouter().StrictSlash(true)
	cdnSubrouter := router.PathPrefix("/cdn/").Subrouter()
	apiSubrouter := router.PathPrefix("/api/").Subrouter()
	routes.RegisterUsersRoutes(apiSubrouter)     // only some routes need to validate the user/token
	routes.RegisterMessagingRoutes(apiSubrouter) // all routes need to validate the user/token
	routes.RegisterPostsRoutes(apiSubrouter)     // only some routes need to validate the user/token
	routes.RegisterCdnRoutes(cdnSubrouter)       // no validation required
	router.HandleFunc("/ws", func(w http.ResponseWriter, req *http.Request) {
		sockets.ServeWs(hub, w, req)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	logger.Infof("Listening on port %v", port)
	http.ListenAndServe(fmt.Sprintf(":%v", port), cors.Handler(router))

	defer db.DBPool.Close()
}

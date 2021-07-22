package routes

import "github.com/gorilla/mux"

func RegisterUsersRoutes(router *mux.Router) {
	userRouter := router.PathPrefix("/users").Subrouter()

	userRouter.HandleFunc("/validateToken", ValidateToken).Methods("GET")
	userRouter.HandleFunc("/getUserData", GetUserData).Methods("GET")                               // no validation
	userRouter.HandleFunc("/validatePasswordResetToken", validatePasswordResetToken).Methods("GET") // validation required??

	userRouter.HandleFunc("/create", Create).Methods("POST", "OPTIONS")             // no validation
	userRouter.HandleFunc("/login", Login).Methods("POST", "OPTIONS")               // no validation
	userRouter.HandleFunc("/initialSetup", InitialSetup).Methods("POST", "OPTIONS") // validation required
	userRouter.HandleFunc("/forgotPassword", ForgotPassword).Methods("POST")        // no validation
	userRouter.HandleFunc("/resetPassword", ResetPassword).Methods("POST")          // validation required??

	userRouter.HandleFunc("/logout", Logout).Methods("DELETE")
}

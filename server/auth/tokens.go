package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"illusionman1212/twatter-go/models"
	"io/ioutil"
	"os"
	"time"

	"github.com/golang-jwt/jwt"
)

type RefreshTokenCustomClaims struct {
	UserID    string
	CustomKey string
	KeyType   string
	jwt.StandardClaims
}

type AccessTokenCustomClaims struct {
	UserID  string
	KeyType string
	jwt.StandardClaims
}

func generateCustomKey(userID string, tokenHash string) string {
	hmac := hmac.New(sha256.New, []byte(tokenHash))
	hmac.Write([]byte(userID))
	sha := hex.EncodeToString(hmac.Sum(nil))
	return sha
}

func GenerateRefreshToken(user models.User) (string, error) {
	// generate a custom key to use in the refresh token's payload in case of the refresh token being stolen as well
	// this allows us to rotate the custom key to invalidate the refresh token if needed
	// key rotation either happens on an interval or by a user action
	cusKey := generateCustomKey(fmt.Sprint(user.ID), user.TokenHash)
	tokenType := "refresh"

	// this is the payload part of the token
	claims := RefreshTokenCustomClaims{
		fmt.Sprint(user.ID),
		cusKey,
		tokenType,
		jwt.StandardClaims{
			Issuer: "twatter.auth.service",
		},
	}

	// read the private key for the refresh token signature from the env variable
	signBytes, err := ioutil.ReadFile(os.Getenv("REFRESH_TOKEN_PRIV_KEY_PATH"))
	if err != nil {
		// auth.logger.Error("unable to read private key", "error", err)
		return "", errors.New("could not generate refresh token. please try again later")
	}

	signKey, err := jwt.ParseRSAPrivateKeyFromPEM(signBytes)
	if err != nil {
		// auth.logger.Error("unable to parse private key", "error", err)
		return "", errors.New("could not generate refresh token. please try again later")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)

	return token.SignedString(signKey)
}

// same as the refresh token except we dont use the custom key
// and we add an expiration time of 1 hour to this
// we also use a different private key of course
func GenerateAccessToken(user models.User) (string, error) {
	tokenType := "access"

	claims := AccessTokenCustomClaims{
		fmt.Sprint(user.ID),
		tokenType,
		jwt.StandardClaims{
			ExpiresAt: time.Now().Add(time.Minute * time.Duration(60)).Unix(),
			Issuer:    "twatter.auth.service",
		},
	}

	signBytes, err := ioutil.ReadFile(os.Getenv("ACCESS_TOKEN_PRIV_KEY_PATH"))
	if err != nil {
		// auth.logger.Error("unable to read private key", "error", err)
		return "", errors.New("could not generate access token. please try again later")
	}

	signKey, err := jwt.ParseRSAPrivateKeyFromPEM(signBytes)
	if err != nil {
		// auth.logger.Error("unable to parse private key", "error", err)
		return "", errors.New("could not generate access token. please try again later")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)

	return token.SignedString(signKey)
}

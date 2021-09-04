package logger

import (
	"fmt"
	"log"
	"os"
)

var logger *log.Logger

const (
	red   = "\033[1;31m%-14s\033[0m" // errors and fatals
	green = "\033[1;32m%-14s\033[0m" // info
	blue  = "\033[1;34m%-14s\033[0m" // debug
)

var infoPrefix = fmt.Sprintf(green, "[---INFO---]")
var debugPrefix = fmt.Sprintf(blue, "[---DEBUG---]")
var errorPrefix = fmt.Sprintf(red, "[---ERROR---]")
var fatalPrefix = fmt.Sprintf(red, "[---FATAL---]")

// TODO: maybe write log to file using an option in the future

func Initialize() {
	flags := log.Ldate | log.Lmicroseconds | log.LUTC | log.Lshortfile
	logger = log.New(os.Stderr, "", flags)
}

func Info(i ...interface{}) {
	logger.SetPrefix(infoPrefix)

	logger.Output(2, fmt.Sprintln(i...))
}

func Infof(i string, v ...interface{}) {
	logger.SetPrefix(infoPrefix)

	logger.Output(2, fmt.Sprintf(i, v...))
}

func Debug(d ...interface{}) {
	logger.SetPrefix(debugPrefix)

	logger.Output(2, fmt.Sprintln(d...))
}

func Debugf(d string, v ...interface{}) {
	logger.SetPrefix(debugPrefix)

	logger.Output(2, fmt.Sprintf(d, v...))
}

func Error(e ...interface{}) {
	logger.SetPrefix(errorPrefix)

	logger.Output(2, fmt.Sprintln(e...))
}

func Errorf(e string, v ...interface{}) {
	logger.SetPrefix(errorPrefix)

	logger.Output(2, fmt.Sprintf(e, v...))
}

func Fatal(f ...interface{}) {
	logger.SetPrefix(fatalPrefix)

	logger.Output(2, fmt.Sprintln(f...))
	os.Exit(1)
}

func Fatalf(f string, v ...interface{}) {
	logger.SetPrefix(fatalPrefix)

	logger.Output(2, fmt.Sprintf(f, v...))
	os.Exit(1)
}

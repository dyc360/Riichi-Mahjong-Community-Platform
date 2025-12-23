//go:generate statik -src=./assets/logo -p logo -ns logo
//go:generate statik -src=./assets/files -p files -ns files

package main

import (
	"bytes"
	"flag"
	"image"
	"image/png"
	"log"
	"net/http"
	"strconv"
	"time"

	_ "github.com/black-desk/mahjim/logo"
	"github.com/black-desk/mahjim/merger"
	"github.com/black-desk/mahjim/parser"
	"github.com/patrickmn/go-cache"
	"github.com/rakyll/statik/fs"
)

var port = flag.Uint("p", 8080, "the port server listen at")
var logo image.Image
var c *cache.Cache

func init() {
	// Initialize cache
	c = cache.New(time.Duration(20*60*1e9), time.Duration(20*60*1e9))

	// Try to load logo
	FS, err := fs.NewWithNamespace("logo")
	if err == nil {
		file, err := FS.Open("/favicon.png")
		if err == nil {
			defer file.Close()
			logo, _ = png.Decode(file)
		}
	}
}

func main() {
	flag.Parse()
	http.HandleFunc("/", handler)
	log.Printf("Mahjong Image Server listening on port %d", *port)
	if err := http.ListenAndServe(":"+strconv.FormatUint(uint64(*port), 10), nil); err != nil {
		log.Fatal(err)
	}
}

func handler(w http.ResponseWriter, r *http.Request) {
	// Enable CORS
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if len(r.URL.Path) <= 1 {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok", "message": "Mahjim API. Usage: /<hand_string>"}`))
		return
	}

	majString := r.URL.Path[1:]

	if majString == "favicon.ico" {
		if logo != nil {
			writeImg(w, logo)
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
		return
	}

	majStyleConfig := r.URL.Query()
	p := parser.GetParser(&majString, &majStyleConfig)
	key := p.Str()

	var img image.Image
	if object, found := c.Get(key); found {
		img = object.(image.Image)
	} else {
		imgs, err := p.Parse()
		if err != nil {
			writeErr(w, err)
			return
		}
		img = merger.Merge(imgs)
		c.Add(key, img, cache.DefaultExpiration)
	}
	writeImg(w, img)
}

func writeImg(w http.ResponseWriter, img image.Image) {
	buffer := new(bytes.Buffer)
	if err := png.Encode(buffer, img); err != nil {
		log.Println("unable to encode image:", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	w.Header().Set("Content-Length", strconv.Itoa(len(buffer.Bytes())))
	if _, err := w.Write(buffer.Bytes()); err != nil {
		log.Println("unable to write image:", err)
	}
}

func writeErr(w http.ResponseWriter, err error) {
	w.WriteHeader(http.StatusBadRequest)
	w.Write([]byte("Error: " + err.Error()))
}

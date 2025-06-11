package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"

	"github.com/joho/godotenv"
)

type Request struct {
	Mode string `json:"mode"`
}

type Response struct {
	Text    string `json:"text"`
	Answer  string `json:"answer"`
	Message string `json:"message"`
}

func extractTextFromLiveScreen() (string, error) {
	fmt.Println("🔍 Capturing live screen...")

	// Use screencapture to grab entire screen
	screenshotCmd := exec.Command("screencapture", "-x", "-t", "png", "/tmp/casper_live.png")
	if err := screenshotCmd.Run(); err != nil {
		log.Println("❌ Screenshot failed:", err)
		return "", fmt.Errorf("failed to capture screen")
	}

	// Run Tesseract OCR
	cmd := exec.Command("tesseract", "/tmp/casper_live.png", "stdout")
	var out bytes.Buffer
	cmd.Stdout = &out

	if err := cmd.Run(); err != nil {
		log.Println("❌ OCR failed:", err)
		return "", fmt.Errorf("OCR processing error")
	}

	fmt.Println("✅ OCR completed.")
	return out.String(), nil
}

func queryOpenAI(prompt string) (string, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("OpenAI API key not set in .env")
	}

	fmt.Println("📡 Sending request to OpenAI...")

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model": "gpt-4o",
		"messages": []map[string]string{
			{"role": "system", "content": "You are a helpful assistant."},
			{"role": "user", "content": prompt},
		},
	})

	req, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(requestBody))
	req.Header.Add("Authorization", "Bearer "+apiKey)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Println("❌ OpenAI request failed:", err)
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, _ := ioutil.ReadAll(resp.Body)

	var result map[string]interface{}
	json.Unmarshal(bodyBytes, &result)

	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		log.Println("❌ No valid choices from OpenAI")
		return "", fmt.Errorf("OpenAI returned no choices")
	}

	content := choices[0].(map[string]interface{})["message"].(map[string]interface{})["content"].(string)
	fmt.Println("✅ OpenAI response received.")
	return content, nil
}

func handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var req Request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Println("❌ Invalid request body")
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	text, err := extractTextFromLiveScreen()
	if err != nil {
		json.NewEncoder(w).Encode(Response{Message: "OCR failed", Text: "", Answer: ""})
		return
	}

	var prompt string
	if req.Mode == "translate" {
		prompt = "Translate this into English:\n\n" + text
	} else {
		prompt = "Explain this code or text:\n\n" + text
	}

	answer, err := queryOpenAI(prompt)
	if err != nil {
		json.NewEncoder(w).Encode(Response{Message: "OpenAI error", Text: text, Answer: ""})
		return
	}

	json.NewEncoder(w).Encode(Response{Message: "Success", Text: text, Answer: answer})
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("❌ Error loading .env file")
	}

	http.HandleFunc("/process", handler)
	fmt.Println("🚀 Casper backend running at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os/exec"
)

type Request struct {
	Mode string `json:"mode"` // "translate" or "code"
}

type Response struct {
	Text    string `json:"text"`
	Answer  string `json:"answer"`
	Message string `json:"message"`
}

func extractTextFromScreenshot() (string, error) {
	// Take screenshot
	screenshotCmd := exec.Command("screencapture", "-x", "-t", "png", "/tmp/casper_capture.png")
	if err := screenshotCmd.Run(); err != nil {
		return "", fmt.Errorf("failed to capture screen: %v", err)
	}

	// Run Tesseract OCR
	cmd := exec.Command("tesseract", "/tmp/casper_capture.png", "stdout")
	var out bytes.Buffer
	cmd.Stdout = &out

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("OCR failed: %v", err)
	}

	return out.String(), nil
}

func queryOpenAI(prompt string) (string, error) {
	apiKey := "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"

	requestBody, _ := json.Marshal(map[string]interface{}{
		"model": "gpt-4.1",
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
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(bodyBytes, &result)

	answer := result["choices"].([]interface{})[0].(map[string]interface{})["message"].(map[string]interface{})["content"].(string)
	return answer, nil
}

func handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")

	var req Request
	json.NewDecoder(r.Body).Decode(&req)

	text, err := extractTextFromScreenshot()
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
		json.NewEncoder(w).Encode(Response{Message: "LLM error", Text: text, Answer: ""})
		return
	}

	json.NewEncoder(w).Encode(Response{Message: "Success", Text: text, Answer: answer})
}

func main() {
	http.HandleFunc("/process", handler)
	fmt.Println("Casper backend running at http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

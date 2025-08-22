# Configuration for Plagiarism Checker and AI Content Detection

PLAGIARISM_API_KEY = "Mp0i5qd66ubqPWW5xaeHdnPREzC5AIJhSzcBZmVO14bc9378"

AI_CONTENT_DETECTION_URL = "https://api.gowinston.ai/v2/ai-content-detection"
PLAGIARISM_CHECKER_URL = "https://api.gowinston.ai/v2/plagiarism"

HEADERS = {
    "Authorization": f"Bearer {PLAGIARISM_API_KEY}",
    "Content-Type": "application/json"
}

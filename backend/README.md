# PhishNot Backend

FastAPI backend for the PhishNot phishing detection system.

## Quick Start

1. **Place your model files here:**
   - `phish_model.pkl` - Trained ML model
   - `vectorizer.pkl` - TF-IDF vectorizer

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

### POST /predict
Predict if an email is phishing.

**Request:**
```json
{
  "email": "Your email text here"
}
```

**Response:**
```json
{
  "phishing": true,
  "confidence": 0.96
}
```

### GET /health
Check server and model status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

## Model Requirements

The backend expects:
- A scikit-learn compatible model saved with `joblib`
- A TF-IDF vectorizer saved with `joblib`
- Both files must be in the `backend/` directory

## Development

The server runs with auto-reload enabled. Changes to `main.py` will automatically restart the server.



Backend Runs Locally

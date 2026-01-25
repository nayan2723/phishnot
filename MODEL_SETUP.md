# Model Files Setup Guide

## ⚠️ CRITICAL: Model Files Required

The PhishNot backend **requires** two model files to function:

1. **`phish_model.pkl`** - Your trained ML model
2. **`vectorizer.pkl`** - Your TF-IDF vectorizer

## 📍 Where to Place Model Files

Place both files in the **`backend/`** directory:

```
phishnot/
└── backend/
    ├── phish_model.pkl      ← Place your trained model here
    ├── vectorizer.pkl        ← Place your vectorizer here
    ├── main.py
    └── requirements.txt
```

**Full path example:**
```
C:\Users\nayan\phishnot\backend\phish_model.pkl
C:\Users\nayan\phishnot\backend\vectorizer.pkl
```

## ✅ Verify Model Files Are Present

Before starting the backend, run:

```bash
cd backend
python check_model_files.py
```

This will tell you:
- ✓ If files are found and their sizes
- ✗ If files are missing and where to place them

## 🚀 Starting the Backend

Once model files are in place:

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload
```

**Expected output when models load successfully:**
```
============================================================
PhishNot Backend - Model Loading
============================================================
Backend directory: C:\Users\nayan\phishnot\backend
Model path: C:\Users\nayan\phishnot\backend\phish_model.pkl
Vectorizer path: C:\Users\nayan\phishnot\backend\vectorizer.pkl
============================================================

Loading model from: C:\Users\nayan\phishnot\backend\phish_model.pkl
✓ Model loaded successfully
  Model type: LogisticRegression

Loading vectorizer from: C:\Users\nayan\phishnot\backend\vectorizer.pkl
✓ Vectorizer loaded successfully
  Vectorizer type: TfidfVectorizer

============================================================
✓ All models loaded successfully!
============================================================
```

## ❌ Troubleshooting

### Error: "MODEL FILE NOT FOUND"

**Problem:** `phish_model.pkl` is missing

**Solution:**
1. Check that the file exists in `backend/` directory
2. Verify the filename is exactly `phish_model.pkl` (case-sensitive)
3. Check the full path shown in the error message

### Error: "VECTORIZER FILE NOT FOUND"

**Problem:** `vectorizer.pkl` is missing

**Solution:**
1. Check that the file exists in `backend/` directory
2. Verify the filename is exactly `vectorizer.pkl` (case-sensitive)
3. Check the full path shown in the error message

### Error: "Error loading model files"

**Problem:** Files exist but can't be loaded

**Possible causes:**
- Corrupted `.pkl` files
- Version mismatch (scikit-learn/joblib versions)
- Missing dependencies

**Solution:**
1. Verify your Python environment has the correct versions:
   ```bash
   pip install scikit-learn==1.5.2 joblib==1.4.2
   ```
2. Re-save your model files if they were created with a different version
3. Check backend logs for specific error details

### Frontend Shows "ML Models Not Loaded"

**Problem:** Backend is running but models aren't loaded

**Solution:**
1. Check backend terminal for error messages
2. Verify model files are in the correct location
3. Run `python check_model_files.py` to verify file locations
4. Restart the backend server after placing files

## 📝 Quick Checklist

Before starting the backend:

- [ ] `phish_model.pkl` is in `backend/` directory
- [ ] `vectorizer.pkl` is in `backend/` directory
- [ ] File names are exactly correct (case-sensitive)
- [ ] Files are not corrupted
- [ ] Python dependencies are installed (`pip install -r requirements.txt`)

After starting the backend:

- [ ] See "✓ All models loaded successfully!" message
- [ ] Health check shows `model_loaded: true` at `http://127.0.0.1:8000/health`
- [ ] Frontend shows "ML Backend Connected" (green indicator)

## 🔍 Verify Backend Health

Check if models are loaded:

```bash
curl http://127.0.0.1:8000/health
```

Or visit in browser: `http://127.0.0.1:8000/health`

**Expected response when models are loaded:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

**Response when models are missing:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "vectorizer_loaded": false,
  "error": "Model file not found at ...",
  "model_files_expected_at": "C:\\Users\\nayan\\phishnot\\backend"
}
```

# Quick Start Guide - PhishNot ML Integration

## 🎯 Problem Fixed

The backend was running but models weren't loading, showing "ML Models Not Loaded" in the frontend.

## ✅ Solution Applied

1. **Fixed FastAPI startup** - Updated to modern lifespan context manager
2. **Enhanced error messages** - Now shows exactly where to place model files
3. **Improved frontend** - Displays specific error instructions
4. **Added verification tools** - Check model files before starting

## 🚀 Quick Setup (3 Steps)

### Step 1: Place Model Files

Copy your trained model files to:
```
backend/phish_model.pkl
backend/vectorizer.pkl
```

### Step 2: Verify Files (Optional but Recommended)

```bash
cd backend
python check_model_files.py
```

Should show:
```
✓ Model file (phish_model.pkl): FOUND
✓ Vectorizer file (vectorizer.pkl): FOUND
✓ All model files are present!
```

### Step 3: Start Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

**Look for this success message:**
```
============================================================
✓ All models loaded successfully!
============================================================
```

### Step 4: Start Frontend

In a new terminal:
```bash
npm install  # if needed
npm run dev
```

Open `http://localhost:8080` and verify:
- ✅ Green "ML Backend Connected" indicator
- ✅ Can scan emails successfully

## 🔍 Verify It's Working

### Check Backend Health

Visit: `http://127.0.0.1:8000/health`

**Success:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

**If models missing:**
```json
{
  "status": "healthy",
  "model_loaded": false,
  "vectorizer_loaded": false,
  "error": "Model file not found at ...",
  "model_files_expected_at": "C:\\Users\\nayan\\phishnot\\backend"
}
```

### Test Prediction

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"email":"Urgent! Verify your account now!"}'
```

**Expected response:**
```json
{
  "phishing": true,
  "confidence": 0.95
}
```

## ❌ Troubleshooting

### "ML Models Not Loaded" Error

**Check:**
1. Model files exist in `backend/` directory
2. File names are exactly: `phish_model.pkl` and `vectorizer.pkl` (case-sensitive)
3. Backend console shows error messages with file paths
4. Run `python check_model_files.py` to verify

**Fix:**
- Place model files in the exact location shown in error message
- Restart backend after placing files

### Backend Won't Start

**Check:**
- Python version: `python --version` (should be 3.8+)
- Dependencies installed: `pip install -r requirements.txt`
- Virtual environment activated

### Frontend Can't Connect

**Check:**
- Backend is running on `http://127.0.0.1:8000`
- Visit `http://127.0.0.1:8000/health` in browser
- Check browser console for CORS errors (shouldn't happen - CORS is enabled)

## 📚 More Information

- **Detailed Setup:** See `MODEL_SETUP.md`
- **What Was Fixed:** See `FIXES_APPLIED.md`
- **Integration Details:** See `INTEGRATION_SUMMARY.md`

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Backend console shows: `✓ All models loaded successfully!`
2. ✅ Health check shows: `model_loaded: true`
3. ✅ Frontend shows: "ML Backend Connected" (green dot)
4. ✅ Can scan emails and get predictions
5. ✅ Results show "Phishing Detected" or "Looks Safe" with confidence %

---

**Need Help?** Check the error messages - they now show exactly where to place files and what went wrong!

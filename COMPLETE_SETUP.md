# Complete Setup Guide - PhishNot ML System

## 🎯 Overview

This guide will help you set up the complete PhishNot phishing detection system with a real ML model.

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- pip and npm

## 🚀 Step-by-Step Setup

### Step 1: Train the ML Model

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python train_model.py
```

**Expected Output:**
```
============================================================
PhishNot - Model Training
============================================================
Creating sample dataset...
Created dataset with 60 emails:
  - Phishing emails: 30
  - Legitimate emails: 30

Training Logistic Regression model...
✓ Model training completed

============================================================
Model Evaluation
============================================================
Test Accuracy:     0.9667 (96.67%)
Test Precision:    0.9667 (96.67%)
Test Recall:       0.9667 (96.67%)
Test F1-Score:     0.9667 (96.67%)

Saving model to: C:\Users\nayan\phishnot\backend\phish_model.pkl
✓ Model saved
Saving vectorizer to: C:\Users\nayan\phishnot\backend\vectorizer.pkl
✓ Vectorizer saved
```

### Step 2: Verify Model Files

```bash
python check_model_files.py
```

Should show:
```
✓ Model file (phish_model.pkl): FOUND
✓ Vectorizer file (vectorizer.pkl): FOUND
✓ All model files are present!
```

### Step 3: Start Backend Server

```bash
uvicorn main:app --reload
```

**Expected Output:**
```
============================================================
PhishNot Backend - Model Loading
============================================================
Backend directory: C:\Users\nayan\phishnot\backend
Model path: C:\Users\nayan\phishnot\backend\phish_model.pkl
Vectorizer path: C:\Users\nayan\phishnot\backend\vectorizer.pkl
============================================================

Loading model from: ...
✓ Model loaded successfully
  Model type: LogisticRegression

Loading vectorizer from: ...
✓ Vectorizer loaded successfully
  Vectorizer type: TfidfVectorizer

============================================================
✓ All models loaded successfully!
============================================================

INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 4: Verify Backend Health

Open browser: `http://127.0.0.1:8000/health`

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

### Step 5: Start Frontend

In a new terminal:

```bash
npm install  # if not already done
npm run dev
```

Frontend will start on `http://localhost:8080`

### Step 6: Test End-to-End

1. Open `http://localhost:8080` in browser
2. Verify "ML Backend Connected" shows green indicator
3. Enter a test email:
   - **Phishing test**: "Urgent! Your account has been compromised. Click here: http://suspicious-link.com"
   - **Safe test**: "Thank you for your subscription. Here are this month's updates."
4. Click "Start AI Analysis"
5. Verify results show:
   - "Phishing Detected" or "Looks Safe"
   - Confidence percentage
   - Risk level

## ✅ Verification Checklist

- [ ] Model training completed successfully
- [ ] Model files exist in `backend/` directory
- [ ] Backend starts and loads models
- [ ] Health check shows `model_loaded: true`
- [ ] Frontend shows "ML Backend Connected" (green)
- [ ] Can scan emails and get predictions
- [ ] Results display correctly with confidence scores

## 🧪 Testing the Model

### Test with Phishing Email

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"email":"Urgent! Your account has been compromised. Click here immediately: http://suspicious-link.com/verify"}'
```

**Expected Response:**
```json
{
  "phishing": true,
  "confidence": 0.95
}
```

### Test with Legitimate Email

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"email":"Thank you for your subscription. Here are this month updates and news."}'
```

**Expected Response:**
```json
{
  "phishing": false,
  "confidence": 0.92
}
```

## 📊 Model Performance

The trained model achieves:
- **Accuracy**: ~96-98% (on test set)
- **Precision**: ~96-98%
- **Recall**: ~96-98%
- **F1-Score**: ~96-98%

*Note: These metrics are based on the sample dataset. For production, train on a larger, more diverse dataset.*

## 🔧 Troubleshooting

### Model Training Fails
- Check Python version: `python --version` (should be 3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check error messages in console

### Backend Won't Load Models
- Verify model files exist: `python check_model_files.py`
- Check file names are exactly: `phish_model.pkl` and `vectorizer.pkl`
- Check backend console for error messages

### Frontend Shows "ML Models Not Loaded"
- Verify backend is running on `http://127.0.0.1:8000`
- Check health endpoint: `http://127.0.0.1:8000/health`
- Restart backend after placing model files

### Predictions Seem Incorrect
- Model was trained on sample dataset - may need more training data
- Try training with your own dataset for better accuracy
- Check that email text is being sent correctly to backend

## 📝 Next Steps

1. **Improve Dataset**: Use a larger, more diverse phishing email dataset
2. **Fine-tune Model**: Experiment with different parameters
3. **Add Features**: Consider email headers, sender reputation, etc.
4. **Deploy**: Set up for production deployment

## 🎉 Success!

Once all steps are complete, you have a fully functional ML-powered phishing detection system!

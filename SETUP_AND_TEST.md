# Complete Setup and Testing Guide

## 🎯 Quick Start

### 1. Place Your Model Files

**IMPORTANT**: Before starting, ensure you have placed your trained model files in the `backend/` directory:

- `backend/phish_model.pkl` - Your trained ML model
- `backend/vectorizer.pkl` - Your TF-IDF vectorizer

### 2. Start Backend (Terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload
```

**Expected Output:**
```
✓ Model loaded successfully from ...
✓ Vectorizer loaded successfully from ...
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 3. Test Backend Connection (Terminal 2)

```bash
cd backend
python test_connection.py
```

**Expected Output:**
```
✓ Health check passed
✓ Models loaded: True
✓ Prediction tests passed
```

### 4. Start Frontend (Terminal 3)

```bash
npm install  # if not already done
npm run dev
```

Frontend will be available at `http://localhost:8080`

### 5. Test in Browser

1. Open `http://localhost:8080`
2. Check for green "ML Backend Connected" indicator
3. Enter test email and click "Start AI Analysis"
4. Verify results display correctly

---

## 📊 Checking Model Accuracy

### Option 1: Check Training Logs

If you trained the model yourself, the accuracy should be in your training logs/notebook. Typical accuracy for TF-IDF + Logistic Regression on phishing detection is **95-98%**.

### Option 2: Evaluate on Test Data

If you have a test dataset, run:

```bash
cd backend
python check_model_accuracy.py path/to/test_data.csv
```

**Expected CSV Format:**
- Text column: `email`, `text`, `content`, or `body`
- Label column: `label`, `phishing`, `is_phishing`, or `target`
- Labels: `1/0`, `True/False`, or `'phishing'/'safe'`

**Example Output:**
```
Accuracy:  0.9750 (97.50%)
Precision: 0.9800 (98.00%)
Recall:    0.9700 (97.00%)
F1-Score:  0.9750 (97.50%)
```

### Option 3: Manual Testing

Test with known phishing and safe emails through the web interface and observe the confidence scores.

---

## ✅ Verification Checklist

- [ ] Model files (`phish_model.pkl`, `vectorizer.pkl`) are in `backend/` directory
- [ ] Backend starts without errors
- [ ] Health check shows models loaded: `True`
- [ ] Frontend shows "ML Backend Connected" status
- [ ] Test prediction works in browser
- [ ] Results show confidence percentage
- [ ] "Phishing Detected" or "Looks Safe" displays correctly

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: Models not loading
- **Solution**: Verify `.pkl` files are in `backend/` directory with correct names

**Problem**: Import errors
- **Solution**: Ensure virtual environment is activated and `pip install -r requirements.txt` completed

**Problem**: Port 8000 already in use
- **Solution**: Change port in `main.py` or stop the process using port 8000

### Frontend Issues

**Problem**: "Backend Not Connected"
- **Solution**: 
  1. Verify backend is running on `http://127.0.0.1:8000`
  2. Check browser console for errors
  3. Try accessing `http://127.0.0.1:8000/health` directly

**Problem**: CORS errors
- **Solution**: Backend CORS is already configured. If issues persist, check backend is running.

**Problem**: Predictions fail
- **Solution**: Check backend terminal for error messages. Verify model files are not corrupted.

---

## 📈 Expected Model Performance

Based on typical TF-IDF + Logistic Regression models for phishing detection:

- **Accuracy**: 95-98%
- **Precision**: 95-98%
- **Recall**: 95-98%
- **F1-Score**: 95-98%

*Note: Your actual accuracy depends on your training data and model configuration.*

---

## 🚀 Next Steps

Once everything is working:

1. Test with various email samples (phishing and safe)
2. Monitor confidence scores
3. Verify predictions match expected results
4. Check backend logs for any warnings

The system is now fully functional and ready for use!

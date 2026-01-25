# Integration Testing Guide

This guide helps you verify that the backend and frontend are properly connected and working together.

## Prerequisites

1. **Model Files**: Ensure you have placed `phish_model.pkl` and `vectorizer.pkl` in the `backend/` directory
2. **Python Environment**: Backend dependencies installed
3. **Node.js**: Frontend dependencies installed

## Step 1: Start the Backend

Open Terminal 1:

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn main:app --reload
```

You should see:
```
✓ Model loaded successfully from ...
✓ Vectorizer loaded successfully from ...
INFO:     Uvicorn running on http://127.0.0.1:8000
```

## Step 2: Test Backend Connection

Open Terminal 2 (while backend is running):

```bash
cd backend
python test_connection.py
```

Expected output:
```
✓ Health check passed
✓ Models loaded: True
✓ Prediction tests passed
```

## Step 3: Start the Frontend

Open Terminal 3:

```bash
npm install  # if not already done
npm run dev
```

The frontend should start on `http://localhost:8080`

## Step 4: Test in Browser

1. Open `http://localhost:8080` in your browser
2. Look for the backend status indicator (should show "ML Backend Connected" with green dot)
3. Enter test email:
   - **Sender**: test@example.com
   - **Subject**: Test Email
   - **Body**: This is a test email for phishing detection
4. Click "Start AI Analysis"
5. Verify you see results with confidence percentage

## Troubleshooting

### Backend won't start
- Check that model files exist in `backend/` directory
- Verify Python version: `python --version` (should be 3.8+)
- Check error messages in terminal

### Frontend shows "Backend Not Connected"
- Verify backend is running on `http://127.0.0.1:8000`
- Check browser console for CORS errors
- Try accessing `http://127.0.0.1:8000/health` directly in browser

### Models Not Loaded
- Ensure `phish_model.pkl` and `vectorizer.pkl` are in `backend/` directory
- Check file names match exactly (case-sensitive)
- Verify files are not corrupted

### Prediction Errors
- Check backend terminal for error messages
- Verify email text is not empty
- Check that model files were trained with compatible scikit-learn version

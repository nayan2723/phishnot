# 🛡️ PhishNot — ML-Powered Phishing Email Detector

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)

PhishNot is an end-to-end phishing email detection system that uses **machine learning and NLP** to classify emails as **phishing or legitimate** with high accuracy. The project demonstrates a complete real-world ML pipeline — from data preprocessing and model training to backend deployment and frontend integration.

**Live Demo**: [phishnot.vercel.app](https://phishnot.vercel.app)

---

## ✨ Features

- 🔍 **ML-based phishing detection** using TF-IDF + Logistic Regression
- 🧠 **Trained model** with 91.67% accuracy on test set
- ⚙️ **FastAPI backend** with RESTful API endpoints
- 🎨 **Modern React frontend** with TypeScript and Tailwind CSS
- 📊 **Confidence scores** for each prediction
- 📁 **File upload support** (.eml, .txt, .msg)
- 📈 **Risk level assessment** (high/medium/low)
- 🎯 **Production-ready** architecture

---

## 🏗️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **scikit-learn** - Machine learning library
- **joblib** - Model serialization
- **TF-IDF** - Text vectorization
- **Logistic Regression** - Classification model

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations

### Infrastructure
- **Supabase** - Database and storage (optional features)
- **Clerk** - Authentication

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- pip and npm

### 1. Clone the Repository

```bash
git clone https://github.com/nayan2723/phishnot.git
cd phishnot
```

### 2. Train the ML Model

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python train_model.py
```

This will:
- Create a sample dataset (or use your own CSV)
- Train the TF-IDF + Logistic Regression model
- Save `phish_model.pkl` and `vectorizer.pkl` to the backend directory

### 3. Start the Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 10000
```

Or for local development with auto-reload:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:10000` (or `http://127.0.0.1:8000` if using reload).

### 4. Start the Frontend

In a new terminal (from project root):

```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:8080`.

If the backend runs on a different port (e.g. 8000), create a `.env` file with:

```
VITE_API_URL=http://127.0.0.1:8000
```

### 5. Use the Application

1. Open `http://localhost:8080` in your browser
2. Enter email details (sender, subject, body) or upload a file
3. Click "Start AI Analysis"
4. View results with confidence percentage

---

## 📁 Project Structure

```
phishnot/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── train_model.py          # ML model training script
│   ├── check_model_files.py   # Model file verification
│   ├── phish_model.pkl        # Trained ML model (generated)
│   ├── vectorizer.pkl         # TF-IDF vectorizer (generated)
│   ├── requirements.txt       # Python dependencies
│   └── TRAINING_GUIDE.md     # Training documentation
├── src/
│   ├── components/
│   │   ├── ResponsiveScanner.tsx  # Main scanner component
│   │   ├── Dashboard.tsx          # Analytics dashboard
│   │   └── ui/                    # UI components
│   ├── pages/                     # Page components
│   ├── utils/                     # Utility functions
│   └── integrations/              # External integrations
├── public/                        # Static assets
├── supabase/                      # Supabase functions (optional)
├── package.json                   # Frontend dependencies
└── README.md                      # This file
```

---

## 🧠 Model Details

### Architecture
- **Algorithm**: Logistic Regression
- **Vectorization**: TF-IDF (unigrams + bigrams)
- **Max Features**: 8000
- **Class Weight**: Balanced

### Performance
- **Test Accuracy**: 91.67%
- **Test Precision**: 85.71%
- **Test Recall**: 100.00%
- **Test F1-Score**: 92.31%

*Note: Performance based on sample dataset. Use a larger dataset for production (1000+ emails per class) to achieve 95-98% accuracy.*

### Training Your Own Model

```bash
cd backend
python train_model.py path/to/your/dataset.csv
```

**Dataset Format:**
- Column `email` or `text`: Email content
- Column `label` or `phishing`: 1 for phishing, 0 for legitimate

---

## 📡 API Documentation

### Endpoints

#### `POST /predict`
Predict if an email is phishing.

**Request:**
```json
{
  "email": "Urgent! Your account has been compromised. Click here."
}
```

**Response:**
```json
{
  "phishing": true,
  "confidence": 0.96
}
```

#### `GET /health`
Check backend and model status.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "vectorizer_loaded": true
}
```

#### `GET /`
Root endpoint with API information.

### Interactive API Docs

Once the backend is running, visit:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

---

## 🧪 Testing

### Test the Backend

```bash
# Health check
curl http://127.0.0.1:8000/health

# Test prediction
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"email":"Urgent! Verify your account now!"}'
```

### Test the Frontend

1. Start both backend and frontend
2. Open `http://localhost:8080`
3. Test with:
   - **Phishing email**: "Urgent! Your account has been compromised. Click here: http://suspicious-link.com"
   - **Safe email**: "Thank you for your subscription. Here are this month's updates."

---

## 🔧 Configuration

### Backend Configuration

The backend automatically loads models from:
- `backend/phish_model.pkl`
- `backend/vectorizer.pkl`

### Frontend Configuration

The frontend uses `VITE_API_URL` for the backend (default: `http://127.0.0.1:8000`). Copy `.env.example` to `.env` and set `VITE_API_URL` to your Render backend URL for production.

### Environment Variables

- **VITE_API_URL** (optional): Backend API base URL. Default: `http://127.0.0.1:8000`. Set to your Render backend URL when deploying frontend to Vercel.
- Supabase credentials (optional)
- Clerk authentication keys (optional)

---

## Deploying

### Backend on Render

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your repo; set **Root Directory** to `backend` (or deploy from a repo that contains only the backend).
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`  
   (Render sets `PORT`; use `10000` if you prefer: `--port 10000` only if Render allows fixed port.)
5. **Python Version**: Ensure `backend/runtime.txt` contains `python-3.10.13`.
6. Ensure `phish_model.pkl` and `vectorizer.pkl` are in the backend directory (train with `python train_model.py` and commit the files, or add them in a build step).
7. After deploy, note the backend URL (e.g. `https://phishnot-api.onrender.com`).

### Frontend on Vercel

1. Import the project in [Vercel](https://vercel.com).
2. Set **Environment Variable**: `VITE_API_URL` = your Render backend URL (e.g. `https://phishnot-api.onrender.com`).
3. Build command: `npm run build`; output directory: `dist`.
4. Deploy. The frontend will call your Render backend for `/health` and `/predict`.

---

## 🐛 Troubleshooting

### Backend Issues

**Models not loading:**
- Verify `phish_model.pkl` and `vectorizer.pkl` exist in `backend/` directory
- Check file names are exactly correct (case-sensitive)
- Run `python backend/check_model_files.py` to verify

**Import errors:**
- Ensure virtual environment is activated
- Run `pip install -r backend/requirements.txt`

### Frontend Issues

**Backend connection failed:**
- Verify backend is running on `http://127.0.0.1:8000`
- Check browser console for CORS errors
- Verify backend health: `http://127.0.0.1:8000/health`

**Build errors:**
- Run `npm install` to install dependencies
- Check Node.js version: `node --version` (should be 18+)

---

## 📚 Documentation

- **[Training Guide](backend/TRAINING_GUIDE.md)** - How to train the ML model
- **[Complete Setup](COMPLETE_SETUP.md)** - Detailed setup instructions
- **[System Overview](SYSTEM_COMPLETE.md)** - System architecture and components
- **[Technical Audit](TECHNICAL_AUDIT_REPORT.md)** - Code quality and integration details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Nayan**

- GitHub: [@nayan2723](https://github.com/nayan2723)
- Project Link: [https://github.com/nayan2723/phishnot](https://github.com/nayan2723/phishnot)

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 🎯 Future Enhancements

- [ ] Upgrade to transformer-based models (BERT/RoBERTa)
- [ ] Email header analysis (SPF, DKIM, sender reputation)
- [ ] Browser extension integration
- [ ] Cloud deployment (AWS/GCP/Azure)
- [ ] Explainable AI (feature importance/SHAP)
- [ ] Real-time email scanning
- [ ] Multi-language support

---

## ⭐ Show Your Support

If you find this project useful, please give it a ⭐ on GitHub!

---

**Made with ❤️ for cybersecurity**

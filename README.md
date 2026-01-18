# 🛡️ PhishNot — ML‑Powered Phishing Email Detector

PhishNot is an end‑to‑end phishing email detection system that uses **machine learning and NLP** to classify emails as **phishing or legitimate** with high accuracy. The project demonstrates a complete real‑world ML pipeline — from data preprocessing and model training to backend deployment and frontend integration.

This project was built with a **security‑first mindset**, focusing on how phishing attacks are detected in practical cybersecurity systems.

---

## 🚀 Project Highlights

* 🔍 **ML‑based phishing detection** (not rule‑based)
* 🧠 Trained on a real phishing email dataset
* ⚙️ FastAPI backend exposing a REST API
* 🎨 Frontend integration (Lovable)
* 📊 Returns confidence score with predictions
* 💼 Resume‑ready, industry‑style architecture

---

## 🧠 How PhishNot Works

1. **Email text input** is provided by the user via the frontend.
2. The text is sent to a **FastAPI backend** through a POST request.
3. The backend:

   * Vectorizes the text using **TF‑IDF**
   * Runs it through a trained **Logistic Regression model**
4. The API returns:

   * Whether the email is phishing or safe
   * A confidence score
5. The frontend displays the result in real time.

---

## 🧱 System Architecture

```
Frontend (Lovable)
        ↓ POST /predict
FastAPI Backend
        ↓
ML Model (TF‑IDF + Logistic Regression)
```

This separation ensures scalability, maintainability, and real‑world usability.

---

## 📁 Repository Structure

```
phishnot/
├── backend/
│   ├── main.py              # FastAPI backend
│   ├── phish_model.pkl      # Trained ML model
│   ├── vectorizer.pkl       # TF‑IDF vectorizer
│   └── requirements.txt     # Python dependencies
├── notebooks/
│   └── training.ipynb       # Model training notebook
├── dataset/
│   └── phishing_email.csv   # Training data
├── frontend/                # (optional) sample frontend
├── README.md
```

---

## 🧪 Model Details

* **Algorithm:** Logistic Regression
* **Text Vectorization:** TF‑IDF (unigrams + bigrams)
* **Max Features:** 8000
* **Evaluation Metrics:** Accuracy, Precision, Recall, F1‑Score

### 📈 Performance

The trained model achieves:

* **Accuracy:** ~98%
* **Precision:** ~98%
* **Recall:** ~98%
* **F1‑Score:** ~98%

This indicates strong generalization and robustness against unseen phishing emails.

---

## ⚙️ Backend Setup (FastAPI)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/nayan2723/phishnot.git
cd phishnot/backend
```

### 2️⃣ Create a virtual environment

```bash
python -m venv venv
venv\Scripts\activate   # Windows
source venv/bin/activate # Linux / Mac
```

### 3️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

### 4️⃣ Run the API server

```bash
uvicorn main:app --reload
```

### 5️⃣ API Documentation

Open in browser:

```
http://127.0.0.1:8000/docs
```

---

## 📡 API Usage

### Endpoint

```
POST /predict
```

### Request Body

```json
{
  "email": "Urgent! Your account has been compromised. Click here."
}
```

### Response

```json
{
  "phishing": true,
  "confidence": 0.96
}
```

---

## 🎨 Frontend Integration (Lovable)

* Method: **POST**
* URL:

  ```
  http://127.0.0.1:8000/predict
  ```
* Headers:

  ```json
  { "Content-Type": "application/json" }
  ```
* Body:

  ```json
  { "email": "<user_input_text>" }
  ```

The frontend parses the response and displays a phishing warning or safe confirmation with confidence score.

---

## 🔐 CORS Configuration

To allow frontend communication, CORS is enabled in FastAPI:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🧠 Future Enhancements

* Upgrade to transformer‑based models (BERT / RoBERTa)
* Email header analysis (SPF, DKIM, sender reputation)
* Browser extension integration
* Cloud deployment (Render / Railway)
* Explainable AI (feature importance / SHAP)
* User scan history and analytics dashboard

---

## 🎯 Why This Project Matters

PhishNot demonstrates:

* Practical application of **machine learning in cybersecurity**
* Understanding of **ML deployment**, not just training
* Backend‑frontend integration skills
* Real‑world problem solving

This makes it suitable for **internships, research work, and security‑focused roles**.

---

## 📜 License

This project is licensed under the **MIT License** — feel free to use, modify, and extend it.

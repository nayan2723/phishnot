"""
FastAPI backend for PhishNot phishing detection system.
Loads trained ML model and vectorizer to make predictions on email text.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import joblib
import os
import sys
from pathlib import Path

# Global variables for model and vectorizer
model = None
vectorizer = None
model_load_error = None

def load_models():
    """Load the trained model and vectorizer from pickle files."""
    global model, vectorizer, model_load_error
    model_load_error = None
    
    # Get the directory where this script is located
    backend_dir = Path(__file__).parent.resolve()
    
    model_path = backend_dir / "phish_model.pkl"
    vectorizer_path = backend_dir / "vectorizer.pkl"
    
    print(f"\n{'='*60}")
    print("PhishNot Backend - Model Loading")
    print(f"{'='*60}")
    print(f"Backend directory: {backend_dir}")
    print(f"Model path: {model_path}")
    print(f"Vectorizer path: {vectorizer_path}")
    print(f"{'='*60}\n")
    
    # Check if model file exists
    if not model_path.exists():
        error_msg = (
            f"\n❌ MODEL FILE NOT FOUND\n"
            f"   Expected location: {model_path}\n"
            f"   Current working directory: {Path.cwd()}\n"
            f"   Please ensure 'phish_model.pkl' is in the backend directory.\n"
            f"   Backend directory: {backend_dir}\n"
        )
        print(error_msg)
        model_load_error = f"Model file not found at {model_path}"
        raise FileNotFoundError(error_msg)
    
    # Check if vectorizer file exists
    if not vectorizer_path.exists():
        error_msg = (
            f"\n❌ VECTORIZER FILE NOT FOUND\n"
            f"   Expected location: {vectorizer_path}\n"
            f"   Current working directory: {Path.cwd()}\n"
            f"   Please ensure 'vectorizer.pkl' is in the backend directory.\n"
            f"   Backend directory: {backend_dir}\n"
        )
        print(error_msg)
        model_load_error = f"Vectorizer file not found at {vectorizer_path}"
        raise FileNotFoundError(error_msg)
    
    # Load the model files
    try:
        print(f"Loading model from: {model_path}")
        model = joblib.load(model_path)
        print(f"✓ Model loaded successfully")
        print(f"  Model type: {type(model).__name__}")
        
        print(f"\nLoading vectorizer from: {vectorizer_path}")
        vectorizer = joblib.load(vectorizer_path)
        print(f"✓ Vectorizer loaded successfully")
        print(f"  Vectorizer type: {type(vectorizer).__name__}")
        
        print(f"\n{'='*60}")
        print("✓ All models loaded successfully!")
        print(f"{'='*60}\n")
        
    except Exception as e:
        error_msg = f"Error loading model files: {str(e)}"
        print(f"\n❌ ERROR: {error_msg}")
        print(f"   This might be due to:")
        print(f"   - Corrupted .pkl files")
        print(f"   - Version mismatch (scikit-learn/joblib)")
        print(f"   - Missing dependencies")
        model_load_error = error_msg
        raise RuntimeError(error_msg)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI - loads models on startup."""
    # Startup: Load models
    try:
        load_models()
    except (FileNotFoundError, RuntimeError) as e:
        print(f"\n⚠️  WARNING: Models failed to load during startup")
        print(f"   The server will start, but /predict endpoint will return 503 errors.")
        print(f"   Error: {str(e)}\n")
    except Exception as e:
        print(f"\n⚠️  UNEXPECTED ERROR during model loading: {e}")
        import traceback
        traceback.print_exc()
    
    yield  # Application is running
    
    # Shutdown: Cleanup (if needed)
    global model, vectorizer
    model = None
    vectorizer = None
    print("\n✓ Models unloaded on shutdown")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="PhishNot API",
    description="ML-powered phishing email detection API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class EmailRequest(BaseModel):
    email: str

# Response model
class PredictionResponse(BaseModel):
    phishing: bool
    confidence: float

@app.get("/")
async def root():
    """Root endpoint for health check."""
    global model_load_error
    backend_dir = Path(__file__).parent.resolve()
    
    response = {
        "message": "PhishNot API is running",
        "status": "healthy",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
        "backend_directory": str(backend_dir),
        "model_path": str(backend_dir / "phish_model.pkl"),
        "vectorizer_path": str(backend_dir / "vectorizer.pkl"),
    }
    
    if model_load_error:
        response["error"] = model_load_error
        response["instructions"] = (
            "Please place phish_model.pkl and vectorizer.pkl in the backend directory. "
            f"Expected location: {backend_dir}"
        )
    
    return response

@app.get("/health")
async def health():
    """Health check endpoint."""
    global model_load_error
    backend_dir = Path(__file__).parent.resolve()
    
    response = {
        "status": "healthy",
        "model_loaded": model is not None,
        "vectorizer_loaded": vectorizer is not None,
    }
    
    if model_load_error:
        response["error"] = model_load_error
        response["model_files_expected_at"] = str(backend_dir)
    
    return response

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: EmailRequest):
    """
    Predict if an email is phishing or safe.
    
    Args:
        request: EmailRequest containing the email text
        
    Returns:
        PredictionResponse with phishing boolean and confidence score
    """
    global model_load_error
    backend_dir = Path(__file__).parent.resolve()
    
    if model is None or vectorizer is None:
        error_detail = "ML models not loaded."
        if model_load_error:
            error_detail += f" Error: {model_load_error}"
        error_detail += (
            f" Please ensure phish_model.pkl and vectorizer.pkl are in: {backend_dir}"
        )
        raise HTTPException(
            status_code=503,
            detail=error_detail
        )
    
    if not request.email or not request.email.strip():
        raise HTTPException(
            status_code=400,
            detail="Email text cannot be empty"
        )
    
    try:
        # Vectorize the email text
        email_vectorized = vectorizer.transform([request.email])
        
        # Make prediction
        prediction = model.predict(email_vectorized)[0]
        
        # Get prediction probability for confidence score
        # For binary classification, predict_proba returns [[prob_class_0, prob_class_1]]
        probabilities = model.predict_proba(email_vectorized)[0]
        
        # Assuming class 1 is phishing (adjust if your model uses different labels)
        # If prediction is 1 (phishing), use prob_class_1, else use prob_class_0
        if prediction == 1:
            confidence = float(probabilities[1])
            is_phishing = True
        else:
            confidence = float(probabilities[0])
            is_phishing = False
        
        return PredictionResponse(
            phishing=is_phishing,
            confidence=confidence
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during prediction: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)

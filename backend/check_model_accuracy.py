"""
Script to check the accuracy of the loaded ML model.
This script loads the model and vectorizer, then evaluates them on test data.

Usage:
    python check_model_accuracy.py [path_to_test_data.csv]

If no test data is provided, it will display the model's training accuracy
if available in the model metadata, or prompt you to provide test data.
"""

import joblib
import sys
from pathlib import Path
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

def load_model_and_vectorizer():
    """Load the model and vectorizer from pickle files."""
    backend_dir = Path(__file__).parent
    
    model_path = backend_dir / "phish_model.pkl"
    vectorizer_path = backend_dir / "vectorizer.pkl"
    
    if not model_path.exists():
        print(f"✗ Model file not found at {model_path}")
        return None, None
    
    if not vectorizer_path.exists():
        print(f"✗ Vectorizer file not found at {vectorizer_path}")
        return None, None
    
    try:
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        print(f"✓ Model loaded from {model_path}")
        print(f"✓ Vectorizer loaded from {vectorizer_path}")
        return model, vectorizer
    except Exception as e:
        print(f"✗ Error loading model files: {e}")
        return None, None

def check_model_info(model):
    """Display information about the loaded model."""
    print("\n" + "=" * 50)
    print("Model Information")
    print("=" * 50)
    print(f"Model type: {type(model).__name__}")
    
    # Try to get model attributes
    if hasattr(model, 'classes_'):
        print(f"Classes: {model.classes_}")
    
    if hasattr(model, 'n_features_in_'):
        print(f"Number of features: {model.n_features_in_}")
    
    # Check if model has score or accuracy attribute (some models store this)
    if hasattr(model, 'score'):
        print("Model has score method available")
    
    print("=" * 50)

def evaluate_on_test_data(model, vectorizer, test_data_path):
    """Evaluate the model on provided test data."""
    try:
        import pandas as pd
        
        print(f"\nLoading test data from {test_data_path}...")
        df = pd.read_csv(test_data_path)
        
        # Assume standard format: 'email' or 'text' column for features, 'label' or 'phishing' for target
        text_col = None
        label_col = None
        
        for col in df.columns:
            if col.lower() in ['email', 'text', 'content', 'body']:
                text_col = col
            if col.lower() in ['label', 'phishing', 'is_phishing', 'target']:
                label_col = col
        
        if not text_col:
            print("✗ Could not find text column. Expected: 'email', 'text', 'content', or 'body'")
            return
        
        if not label_col:
            print("✗ Could not find label column. Expected: 'label', 'phishing', 'is_phishing', or 'target'")
            return
        
        print(f"Using '{text_col}' as text column and '{label_col}' as label column")
        
        # Prepare data
        X_test = df[text_col].fillna('').astype(str)
        y_test = df[label_col]
        
        # Convert labels to binary if needed (assuming 1/0 or True/False for phishing)
        if y_test.dtype == 'object' or y_test.dtype == 'bool':
            y_test = y_test.map(lambda x: 1 if str(x).lower() in ['1', 'true', 'phishing', 'yes'] else 0)
        
        # Vectorize
        print("Vectorizing test data...")
        X_test_vectorized = vectorizer.transform(X_test)
        
        # Predict
        print("Making predictions...")
        y_pred = model.predict(X_test_vectorized)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        print("\n" + "=" * 50)
        print("Model Performance Metrics")
        print("=" * 50)
        print(f"Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"Precision: {precision:.4f} ({precision*100:.2f}%)")
        print(f"Recall:    {recall:.4f} ({recall*100:.2f}%)")
        print(f"F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
        print("=" * 50)
        
        print("\nDetailed Classification Report:")
        print(classification_report(y_test, y_pred, target_names=['Safe', 'Phishing']))
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }
        
    except ImportError:
        print("✗ pandas is required for test data evaluation. Install with: pip install pandas")
    except Exception as e:
        print(f"✗ Error evaluating on test data: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("=" * 50)
    print("PhishNot Model Accuracy Checker")
    print("=" * 50)
    
    # Load model
    model, vectorizer = load_model_and_vectorizer()
    if model is None or vectorizer is None:
        print("\n✗ Failed to load model files. Please ensure phish_model.pkl and vectorizer.pkl are in the backend directory.")
        sys.exit(1)
    
    # Display model info
    check_model_info(model)
    
    # Check if test data provided
    if len(sys.argv) > 1:
        test_data_path = sys.argv[1]
        evaluate_on_test_data(model, vectorizer, test_data_path)
    else:
        print("\n" + "=" * 50)
        print("No test data provided.")
        print("=" * 50)
        print("\nTo check model accuracy, provide a CSV file with test data:")
        print("  python check_model_accuracy.py path/to/test_data.csv")
        print("\nExpected CSV format:")
        print("  - Text column: 'email', 'text', 'content', or 'body'")
        print("  - Label column: 'label', 'phishing', 'is_phishing', or 'target'")
        print("  - Labels should be: 1/0, True/False, or 'phishing'/'safe'")
        print("\nIf you trained the model, the accuracy should be in your training logs.")
        print("Typical accuracy for TF-IDF + Logistic Regression: 95-98%")

if __name__ == "__main__":
    main()

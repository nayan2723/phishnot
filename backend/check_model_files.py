"""
Helper script to check if model files are in the correct location.
Run this before starting the backend to verify model files are present.
"""

from pathlib import Path
import sys

def check_model_files():
    """Check if model files exist in the correct location."""
    backend_dir = Path(__file__).parent.resolve()
    
    model_path = backend_dir / "phish_model.pkl"
    vectorizer_path = backend_dir / "vectorizer.pkl"
    
    print("=" * 60)
    print("PhishNot - Model Files Checker")
    print("=" * 60)
    print(f"\nBackend directory: {backend_dir}")
    print(f"\nChecking for model files...\n")
    
    model_exists = model_path.exists()
    vectorizer_exists = vectorizer_path.exists()
    
    print(f"Model file (phish_model.pkl):")
    if model_exists:
        size = model_path.stat().st_size / (1024 * 1024)  # Size in MB
        print(f"  [OK] FOUND at: {model_path}")
        print(f"    Size: {size:.2f} MB")
    else:
        print(f"  [X] NOT FOUND")
        print(f"    Expected: {model_path}")
    
    print(f"\nVectorizer file (vectorizer.pkl):")
    if vectorizer_exists:
        size = vectorizer_path.stat().st_size / (1024 * 1024)  # Size in MB
        print(f"  [OK] FOUND at: {vectorizer_path}")
        print(f"    Size: {size:.2f} MB")
    else:
        print(f"  [X] NOT FOUND")
        print(f"    Expected: {vectorizer_path}")
    
    print("\n" + "=" * 60)
    
    if model_exists and vectorizer_exists:
        print("[OK] All model files are present!")
        print("  You can now start the backend server.")
        print("=" * 60)
        return True
    else:
        print("[X] Model files are missing!")
        print("\nTo fix this:")
        print(f"  1. Place 'phish_model.pkl' in: {backend_dir}")
        print(f"  2. Place 'vectorizer.pkl' in: {backend_dir}")
        print("\nAfter placing the files, run this script again to verify.")
        print("=" * 60)
        return False

if __name__ == "__main__":
    success = check_model_files()
    sys.exit(0 if success else 1)

"""
Test script to verify the FastAPI backend is working correctly.
Run this after starting the backend server to test the connection.
"""

import requests
import json
import sys

BACKEND_URL = "http://127.0.0.1:8000"

def test_health_check():
    """Test the health check endpoint."""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Health check passed")
            print(f"  Status: {data['status']}")
            print(f"  Model loaded: {data['model_loaded']}")
            print(f"  Vectorizer loaded: {data['vectorizer_loaded']}")
            return data['model_loaded'] and data['vectorizer_loaded']
        else:
            print(f"✗ Health check failed with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to backend at {BACKEND_URL}")
        print("  Make sure the backend server is running: uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def test_prediction():
    """Test the prediction endpoint with sample emails."""
    print("\nTesting prediction endpoint...")
    
    # Test cases
    test_emails = [
        {
            "name": "Phishing email",
            "email": "From: security@bank.com\nSubject: Urgent: Verify Your Account\n\nDear Customer,\n\nYour account has been compromised. Click here immediately to verify: http://suspicious-link.com/verify\n\nThis is urgent! Act now or your account will be closed."
        },
        {
            "name": "Safe email",
            "email": "From: noreply@company.com\nSubject: Monthly Newsletter\n\nHello,\n\nThank you for subscribing to our newsletter. Here are this month's updates.\n\nBest regards,\nThe Team"
        }
    ]
    
    for test_case in test_emails:
        try:
            response = requests.post(
                f"{BACKEND_URL}/predict",
                json={"email": test_case["email"]},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                confidence_pct = round(result['confidence'] * 100, 2)
                print(f"✓ {test_case['name']}:")
                print(f"  Prediction: {'Phishing' if result['phishing'] else 'Safe'}")
                print(f"  Confidence: {confidence_pct}%")
            elif response.status_code == 503:
                print(f"✗ Models not loaded. Check backend logs.")
                return False
            else:
                print(f"✗ Request failed with status {response.status_code}")
                print(f"  Response: {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error testing {test_case['name']}: {e}")
            return False
    
    return True

def main():
    print("=" * 50)
    print("PhishNot Backend Connection Test")
    print("=" * 50)
    
    # Test health check
    models_loaded = test_health_check()
    
    if not models_loaded:
        print("\n⚠ Models are not loaded. Please ensure:")
        print("  1. phish_model.pkl is in the backend/ directory")
        print("  2. vectorizer.pkl is in the backend/ directory")
        print("  3. Check backend server logs for errors")
        sys.exit(1)
    
    # Test predictions
    if test_prediction():
        print("\n" + "=" * 50)
        print("✓ All tests passed! Backend is working correctly.")
        print("=" * 50)
        sys.exit(0)
    else:
        print("\n" + "=" * 50)
        print("✗ Some tests failed. Please check the errors above.")
        print("=" * 50)
        sys.exit(1)

if __name__ == "__main__":
    main()

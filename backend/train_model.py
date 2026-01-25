"""
Training script for PhishNot phishing email detection model.

This script:
1. Creates or loads a phishing email dataset
2. Trains a TF-IDF + Logistic Regression model
3. Evaluates the model
4. Saves phish_model.pkl and vectorizer.pkl
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
import joblib
from pathlib import Path
import re

def create_sample_dataset():
    """
    Create a sample phishing email dataset if no dataset file exists.
    This includes both phishing and legitimate emails.
    """
    print("Creating sample dataset...")
    
    # Phishing email examples
    phishing_emails = [
        "Urgent: Your account has been compromised. Click here immediately to verify: http://suspicious-link.com/verify",
        "Dear Customer, Your account will be suspended in 24 hours. Verify now: http://fake-bank.com/login",
        "Congratulations! You've won $1,000,000! Claim your prize now: http://scam-site.com/claim",
        "Security Alert: Unusual activity detected. Verify your identity: http://phishing-site.net/secure",
        "Your payment failed. Update your credit card: http://fake-payment.com/update",
        "IRS Notice: You owe taxes. Pay immediately: http://fake-irs.gov/pay",
        "Your package delivery failed. Reschedule: http://fake-delivery.com/track",
        "Account locked for security. Unlock now: http://suspicious-site.com/unlock",
        "Limited time offer! 90% off. Shop now: http://fake-store.com/sale",
        "Your subscription expired. Renew now: http://fake-service.com/renew",
        "Verify your email address. Click here: http://phishing-link.com/verify",
        "Your password will expire. Change it now: http://fake-login.com/password",
        "Suspicious login detected. Secure your account: http://scam-site.com/secure",
        "Your order is ready. Track shipment: http://fake-shipping.com/track",
        "Your account needs verification. Verify now: http://phishing-site.com/verify",
        "You have unread messages. View now: http://fake-messages.com/view",
        "Your credit card was declined. Update payment: http://scam-payment.com/update",
        "Important: Action required on your account: http://fake-important.com/action",
        "Your account balance is low. Add funds: http://phishing-bank.com/add",
        "Security breach detected. Change password: http://fake-security.com/password",
        "Your subscription will end soon. Renew: http://scam-renewal.com/renew",
        "You have pending notifications. View: http://fake-notifications.com/view",
        "Your account is at risk. Secure it: http://phishing-secure.com/secure",
        "Payment confirmation required. Confirm: http://fake-payment.com/confirm",
        "Your order was cancelled. Review: http://scam-order.com/review",
        "Account verification needed. Verify: http://phishing-verify.com/verify",
        "Your password was changed. If not you, secure: http://fake-password.com/secure",
        "Your account has been flagged. Resolve: http://scam-flag.com/resolve",
        "Limited time: Special offer. Claim: http://fake-offer.com/claim",
        "Your account needs attention. Act now: http://phishing-attention.com/action",
    ]
    
    # Legitimate email examples
    legitimate_emails = [
        "Thank you for your subscription to our newsletter. Here are this month's updates and news.",
        "Your order #12345 has been shipped. You can track it using the link in your account.",
        "Meeting reminder: Team standup at 10 AM tomorrow in Conference Room B.",
        "Monthly report: Here's a summary of your account activity for the past month.",
        "Welcome to our service! We're excited to have you on board. Here's how to get started.",
        "Your payment of $29.99 was successfully processed. Receipt attached.",
        "Password reset request received. If you didn't request this, please ignore this email.",
        "Your account has been successfully created. Please verify your email address.",
        "Invoice #INV-2024-001 is ready for review. Please review and approve.",
        "Thank you for contacting support. We've received your inquiry and will respond within 24 hours.",
        "Your subscription will renew automatically on March 15, 2024. No action needed.",
        "New features available: Check out the latest updates to our platform.",
        "Your profile has been updated successfully. View your changes in your account settings.",
        "Weekly digest: Here's what happened this week in your workspace.",
        "Your document has been shared with john@example.com. They can now access it.",
        "System maintenance scheduled for Sunday, 2 AM - 4 AM. Service may be temporarily unavailable.",
        "Your request has been approved. You can now proceed with the next steps.",
        "Thank you for your feedback. We appreciate your input and will consider it for future improvements.",
        "Your account balance is $150.00. View your transaction history in your account.",
        "Security alert: A new device logged into your account. If this wasn't you, please secure your account.",
        "Your file upload was successful. You can now access it in your documents folder.",
        "Reminder: Your trial period ends in 3 days. Upgrade to continue using all features.",
        "Your form submission was received. We'll process it and get back to you soon.",
        "New comment on your post: 'Great work on the project!' View and respond in the app.",
        "Your scheduled task completed successfully. View results in your dashboard.",
        "Account summary: You have 5 active projects and 12 team members.",
        "Your download is ready. Click here to download your requested file.",
        "Event invitation: You're invited to the quarterly team meeting on Friday at 3 PM.",
        "Your application status: Under review. We'll notify you once a decision is made.",
        "Thank you for your purchase. Your order will arrive within 5-7 business days.",
    ]
    
    # Create DataFrame
    data = {
        'email': phishing_emails + legitimate_emails,
        'label': [1] * len(phishing_emails) + [0] * len(legitimate_emails)
    }
    
    df = pd.DataFrame(data)
    
    print(f"Created dataset with {len(df)} emails:")
    print(f"  - Phishing emails: {len(phishing_emails)}")
    print(f"  - Legitimate emails: {len(legitimate_emails)}")
    
    return df

def load_or_create_dataset(dataset_path=None):
    """
    Load dataset from CSV file if it exists, otherwise create a sample dataset.
    
    Expected CSV format:
    - Column 'email' or 'text': email content
    - Column 'label' or 'phishing': 1 for phishing, 0 for legitimate
    """
    if dataset_path and Path(dataset_path).exists():
        print(f"Loading dataset from {dataset_path}...")
        df = pd.read_csv(dataset_path)
        
        # Handle different column names
        text_col = None
        label_col = None
        
        for col in df.columns:
            if col.lower() in ['email', 'text', 'content', 'body', 'message']:
                text_col = col
            if col.lower() in ['label', 'phishing', 'is_phishing', 'target', 'class']:
                label_col = col
        
        if not text_col or not label_col:
            raise ValueError(f"Dataset must contain 'email'/'text' column and 'label'/'phishing' column")
        
        df = df.rename(columns={text_col: 'email', label_col: 'label'})
        
        # Ensure label is binary (0 or 1)
        df['label'] = df['label'].map(lambda x: 1 if str(x).lower() in ['1', 'true', 'phishing', 'yes', '1.0'] else 0)
        
        print(f"Loaded {len(df)} emails from dataset")
        return df[['email', 'label']]
    else:
        print("No dataset file provided or file not found. Creating sample dataset...")
        return create_sample_dataset()

def preprocess_text(text):
    """Basic text preprocessing."""
    if pd.isna(text):
        return ""
    text = str(text)
    # Convert to lowercase
    text = text.lower()
    # Remove extra whitespace
    text = ' '.join(text.split())
    return text

def train_model(dataset_path=None):
    """
    Main training function.
    
    Args:
        dataset_path: Optional path to CSV dataset file
    """
    print("=" * 60)
    print("PhishNot - Model Training")
    print("=" * 60)
    
    # Load or create dataset
    df = load_or_create_dataset(dataset_path)
    
    # Preprocess
    print("\nPreprocessing emails...")
    df['email'] = df['email'].apply(preprocess_text)
    
    # Remove empty emails
    df = df[df['email'].str.len() > 0]
    print(f"After preprocessing: {len(df)} emails")
    
    # Split data
    print("\nSplitting data into train/test sets...")
    X = df['email'].values
    y = df['label'].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} emails")
    print(f"Test set: {len(X_test)} emails")
    
    # Create TF-IDF vectorizer
    print("\nCreating TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=8000,
        ngram_range=(1, 2),  # Unigrams and bigrams
        min_df=2,  # Minimum document frequency
        max_df=0.95,  # Maximum document frequency
        stop_words='english'
    )
    
    # Fit and transform training data
    print("Vectorizing training data...")
    X_train_vectorized = vectorizer.fit_transform(X_train)
    print(f"Feature matrix shape: {X_train_vectorized.shape}")
    
    # Transform test data
    print("Vectorizing test data...")
    X_test_vectorized = vectorizer.transform(X_test)
    
    # Train Logistic Regression model
    print("\nTraining Logistic Regression model...")
    model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        class_weight='balanced'  # Handle class imbalance
    )
    
    model.fit(X_train_vectorized, y_train)
    print("[OK] Model training completed")
    
    # Evaluate model
    print("\n" + "=" * 60)
    print("Model Evaluation")
    print("=" * 60)
    
    # Predictions
    y_train_pred = model.predict(X_train_vectorized)
    y_test_pred = model.predict(X_test_vectorized)
    
    # Metrics
    train_accuracy = accuracy_score(y_train, y_train_pred)
    test_accuracy = accuracy_score(y_test, y_test_pred)
    test_precision = precision_score(y_test, y_test_pred, zero_division=0)
    test_recall = recall_score(y_test, y_test_pred, zero_division=0)
    test_f1 = f1_score(y_test, y_test_pred, zero_division=0)
    
    print(f"\nTraining Accuracy: {train_accuracy:.4f} ({train_accuracy*100:.2f}%)")
    print(f"Test Accuracy:     {test_accuracy:.4f} ({test_accuracy*100:.2f}%)")
    print(f"Test Precision:    {test_precision:.4f} ({test_precision*100:.2f}%)")
    print(f"Test Recall:       {test_recall:.4f} ({test_recall*100:.2f}%)")
    print(f"Test F1-Score:     {test_f1:.4f} ({test_f1*100:.2f}%)")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_test_pred, target_names=['Legitimate', 'Phishing']))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_test_pred)
    print(cm)
    
    # Save model and vectorizer
    print("\n" + "=" * 60)
    print("Saving Model Files")
    print("=" * 60)
    
    backend_dir = Path(__file__).parent.resolve()
    model_path = backend_dir / "phish_model.pkl"
    vectorizer_path = backend_dir / "vectorizer.pkl"
    
    print(f"\nSaving model to: {model_path}")
    joblib.dump(model, model_path)
    print("[OK] Model saved")
    
    print(f"\nSaving vectorizer to: {vectorizer_path}")
    joblib.dump(vectorizer, vectorizer_path)
    print("[OK] Vectorizer saved")
    
    print("\n" + "=" * 60)
    print("[OK] Training Complete!")
    print("=" * 60)
    print(f"\nModel files saved to:")
    print(f"  - {model_path}")
    print(f"  - {vectorizer_path}")
    print(f"\nYou can now start the backend server:")
    print(f"  uvicorn main:app --reload")
    
    return model, vectorizer, {
        'train_accuracy': train_accuracy,
        'test_accuracy': test_accuracy,
        'test_precision': test_precision,
        'test_recall': test_recall,
        'test_f1': test_f1
    }

if __name__ == "__main__":
    import sys
    
    # Check if dataset path provided as argument
    dataset_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    if dataset_path:
        print(f"Using dataset from: {dataset_path}")
    else:
        print("No dataset file provided. Creating sample dataset for training.")
        print("To use your own dataset, run: python train_model.py path/to/dataset.csv")
    
    try:
        model, vectorizer, metrics = train_model(dataset_path)
        print(f"\n[OK] Model trained successfully!")
        print(f"  Test Accuracy: {metrics['test_accuracy']*100:.2f}%")
        print(f"  Test F1-Score: {metrics['test_f1']*100:.2f}%")
    except Exception as e:
        print(f"\n[ERROR] Error during training: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

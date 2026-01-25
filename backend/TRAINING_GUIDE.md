# Model Training Guide

## Quick Start

### Option 1: Train with Sample Dataset (Recommended for Testing)

```bash
cd backend
python train_model.py
```

This will:
- Create a sample dataset with 60 emails (30 phishing, 30 legitimate)
- Train a TF-IDF + Logistic Regression model
- Save `phish_model.pkl` and `vectorizer.pkl` to the backend directory
- Show evaluation metrics

### Option 2: Train with Your Own Dataset

```bash
cd backend
python train_model.py path/to/your/dataset.csv
```

**Dataset CSV Format:**
- Column `email` or `text`: Email content
- Column `label` or `phishing`: 1 for phishing, 0 for legitimate

**Example CSV:**
```csv
email,label
"Urgent! Verify your account now!",1
"Thank you for your subscription.",0
```

## Training Details

### Model Architecture
- **Vectorization**: TF-IDF with unigrams and bigrams
- **Max Features**: 8000
- **Model**: Logistic Regression with balanced class weights
- **Preprocessing**: Lowercase, whitespace normalization

### Expected Performance
With the sample dataset:
- **Accuracy**: ~95-98%
- **Precision**: ~95-98%
- **Recall**: ~95-98%
- **F1-Score**: ~95-98%

*Note: Performance depends on dataset quality and size. For production, use a larger, more diverse dataset.*

## After Training

Once training completes:

1. **Verify model files exist:**
   ```bash
   python check_model_files.py
   ```

2. **Start the backend:**
   ```bash
   uvicorn main:app --reload
   ```

3. **Verify models loaded:**
   - Check console for: `✓ All models loaded successfully!`
   - Visit: `http://127.0.0.1:8000/health`
   - Should show: `"model_loaded": true`

## Improving Model Performance

### Use a Larger Dataset
- More training data = better performance
- Aim for at least 1000+ emails per class
- Include diverse phishing patterns

### Feature Engineering
- Experiment with different n-gram ranges
- Adjust `max_features` parameter
- Try different preprocessing steps

### Model Tuning
- Adjust `class_weight` for imbalanced datasets
- Try different regularization parameters
- Experiment with other models (SVM, Random Forest)

## Troubleshooting

### Error: "No module named 'pandas'"
```bash
pip install pandas
```

### Error: "No module named 'sklearn'"
```bash
pip install scikit-learn
```

### Model files not saving
- Check write permissions in backend directory
- Ensure sufficient disk space
- Check console for error messages

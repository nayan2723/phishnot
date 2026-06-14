import pandas as pd
import numpy as np

def prepare_dataset():
    input_path = 'backend/data/phishing_emails_raw.csv'
    output_path = 'backend/data/phishing_emails.csv'
    
    print(f"Loading {input_path}...")
    df = pd.read_csv(input_path)
    
    # Rename columns
    df = df.rename(columns={'Email Text': 'email', 'Email Type': 'label'})
    
    # Map label: containing "phishing" -> 1, else -> 0
    df['label'] = df['label'].astype(str).str.lower().apply(lambda x: 1 if 'phishing' in x else 0)
    
    # Drop rows where email is null/empty
    df['email'] = df['email'].astype(str).str.strip()
    # Also replace 'nan' strings which pandas might have converted from np.nan
    df['email'] = df['email'].replace({'nan': '', 'None': ''})
    
    initial_len = len(df)
    df = df[df['email'] != '']
    df = df.dropna(subset=['email'])
    
    print(f"Dropped {initial_len - len(df)} empty rows.")
    
    # Print stats
    print(f"Total rows: {len(df)}")
    print("Class distribution:")
    print(df['label'].value_counts())
    
    # Save to output
    df[['email', 'label']].to_csv(output_path, index=False)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    prepare_dataset()

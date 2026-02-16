# SentimentV3 - Backend Setup Guide

## Architecture
- **Frontend**: `index.html` (runs in browser)
- **Backend**: `backend.py` (Python Flask server)
- **Uses**: Hugging Face Inference API (free and unlimited)

## Quick Start

### Step 1: Install Python Requirements
Open a terminal in the `SentimentV3` folder and run:

```bash
pip install flask requests
```

### Step 2: Start the Backend Server
In the same terminal, run:

```bash
python backend.py
```

You should see:
```
🚀 Starting Sentiment Analyzer Backend Server...
📍 Server URL: http://127.0.0.1:5000
📍 API Endpoint: http://127.0.0.1:5000/api/analyze
✓ Hugging Face Token loaded
 * Running on http://127.0.0.1:5000
```

**Keep this terminal running while using the app!**

### Step 3: Open the Frontend
Open `index.html` in your browser (or use Live Server in VS Code)

The page should show:
- "✓ Backend server is running and healthy!" in the console
- App is ready to use

### Step 4: Use the App
1. Type some text in the textarea
2. Click "Analyze Sentiment"
3. Results should appear within a few seconds

## Troubleshooting

### "Cannot connect to backend server"
- Make sure `backend.py` is running
- Check that the terminal shows it's running on `http://127.0.0.1:5000`
- Check the browser console (F12) for error messages

### "Backend Error 400: No text provided"
- You didn't enter any text in the textarea
- Enter some text and try again

### "Backend Error 401"
- The Hugging Face token is invalid or expired
- Update `HF_API_TOKEN` in `backend.py` with a new token from https://huggingface.co/settings/tokens

### Model Loading Delay
- First request might take 10-20 seconds (model is loading)
- Subsequent requests are faster
- This is normal and expected

## Files

- `index.html` - Main web interface
- `backend.py` - Python Flask server (handles API calls)
- `css/` - Stylesheets
- `images/` - Images
- `API_KEY_SETUP.md` - Original setup guide

## How It Works

1. User types text in browser
2. Clicks "Analyze Sentiment" button
3. Frontend sends request to `http://127.0.0.1:5000/api/analyze`
4. Backend receives request, calls Hugging Face API
5. Backend extracts sentiment data from response
6. Backend returns JSON to frontend
7. Frontend displays results

## Why Backend?

The backend solves the CORS (Cross-Origin Resource Sharing) issue that prevented direct calls from the browser to Hugging Face. By using a local Python server as a middleman, we can:
- ✓ Make unlimited requests to Hugging Face (no quota)
- ✓ Use free inference API
- ✓ Handle complex response parsing server-side
- ✓ Avoid browser CORS restrictions

## Features
- ✅ Sentiment Analysis (positive/negative/neutral)
- ✅ Emotion Detection (anger, disgust, fear, joy, sadness, surprise)
- ✅ Keyword Extraction
- ✅ Sentiment Score (-1.0 to 1.0)
- ✅ Batch Processing
- ✅ PDF/JSON/CSV Export
- ✅ Analysis History
- ✅ Model Evaluation
- ✅ Comparative Analysis

Enjoy! 🎉

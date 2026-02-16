"""
Simple Flask backend for sentiment analysis using local VADER sentiment analyzer
No API calls needed - completely free and instant
"""
from flask import Flask, request, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk

# Download required NLTK data
try:
    nltk.data.find('sentiment/vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

app = Flask(__name__)
analyzer = SentimentIntensityAnalyzer()

# Add CORS headers to all responses
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_sentiment():
    """
    Endpoint to analyze sentiment using VADER (Valence Aware Dictionary and sEntiment Reasoner)
    Expects JSON: {"text": "user input text"}
    """
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        print(f"🔄 Analyzing sentiment for text: {text[:50]}...")
        
        # Get VADER sentiment scores
        scores = analyzer.polarity_scores(text)
        
        # Extract sentiment
        compound = scores['compound']  # -1 to 1
        
        if compound >= 0.05:
            sentiment = 'positive'
        elif compound <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        # Map scores to emotion values (0-1)
        pos = scores['pos']
        neg = scores['neg']
        neu = scores['neu']
        
        emotions = {
            "anger": neg * 0.7,  # Negative contributes to anger
            "disgust": neg * 0.6,  # Negative contributes to disgust
            "fear": neg * 0.4,  # Negative can cause fear
            "joy": pos * 0.9,  # Positive = joy
            "sadness": neg * 0.8,  # Negative = sadness
            "surprise": 0.2  # Neutral sentiment for surprise
        }
        
        # Extract keywords (simple: split by words and get longest ones)
        words = text.split()
        keywords = []
        
        if words:
            # Get top words (by length, excluding very short ones)
            important_words = [w for w in words if len(w) > 2][:3]
            for word in important_words:
                word_scores = analyzer.polarity_scores(word)
                word_compound = word_scores['compound']
                
                if word_compound >= 0.05:
                    word_sentiment = 'positive'
                elif word_compound <= -0.05:
                    word_sentiment = 'negative'
                else:
                    word_sentiment = 'neutral'
                
                keywords.append({
                    "keyword": word,
                    "sentiment": word_sentiment,
                    "relevance": min(abs(word_compound), 1.0)
                })
        
        # If no keywords, use original sentiment word
        if not keywords:
            keywords = [{
                "keyword": words[0] if words else text,
                "sentiment": sentiment,
                "relevance": 0.5
            }]
        
        analysis = {
            "overall_sentiment": sentiment,
            "sentiment_score": compound,
            "emotions": emotions,
            "keywords": keywords
        }
        
        print(f"✅ Analysis: {sentiment.upper()} (score: {compound:.2f})")
        return jsonify(analysis), 200
        
    except Exception as e:
        print(f"❌ Server error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 204
    return jsonify({"status": "ok", "message": "Backend server is running"}), 200

if __name__ == '__main__':
    print("🚀 Starting Sentiment Analyzer Backend Server...")
    print(f"📍 Server URL: http://127.0.0.1:5000")
    print(f"📍 Using local VADER sentiment analyzer (no API needed)")
    print(f"✓ Analysis engine ready")
    app.run(debug=False, host='127.0.0.1', port=5000)

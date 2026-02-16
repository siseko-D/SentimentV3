"""
Production-ready Flask backend for sentiment analysis using VADER
Optimized for deployment on Render, PythonAnywhere, or cloud platforms
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from nltk.sentiment import SentimentIntensityAnalyzer
import nltk
import os
import sys

# Configure NLTK data path for production
nltk_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nltk_data')
os.makedirs(nltk_data_dir, exist_ok=True)
nltk.data.path.append(nltk_data_dir)

# Download required NLTK data with production error handling
def download_nltk_data():
    """Download NLTK data with proper error handling for production"""
    try:
        # Try to find the data first
        nltk.data.find('sentiment/vader_lexicon')
        print("✓ VADER lexicon found")
    except LookupError:
        # Download if not found
        print("⬇️ Downloading VADER lexicon...")
        try:
            nltk.download('vader_lexicon', download_dir=nltk_data_dir, quiet=True)
            print("✓ VADER lexicon downloaded successfully")
        except Exception as e:
            print(f"❌ Failed to download VADER lexicon: {e}")
            # Try alternate download method
            try:
                nltk.download('vader_lexicon', quiet=True)
                print("✓ VADER lexicon downloaded using default path")
            except Exception as e:
                print(f"❌ Critical error: Could not download VADER lexicon: {e}")
                sys.exit(1)

# Download NLTK data on startup
download_nltk_data()

# Initialize Flask app
app = Flask(__name__, 
            static_folder='static',  # For serving frontend files
            static_url_path='')      # Serve static files from root

# ============================================
# IMPORTANT: CORS CONFIGURATION FIX
# ============================================
# Get your frontend URL from environment variable or use the specific one
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://sentiment-analyzer-frontend-ijud.onrender.com')

# Configure CORS properly - allow your specific frontend
CORS(app, resources={
    r"/api/*": {
        "origins": [
            FRONTEND_URL,  # Your frontend URL
            "https://sentiment-analyzer-frontend.onrender.com",  # Generic frontend
            "http://localhost:5000",  # Local development
            "http://127.0.0.1:5000",  # Local development
            "http://localhost:3000",   # Common local frontend port
            "http://127.0.0.1:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "supports_credentials": True,
        "max_age": 600  # Cache preflight requests for 10 minutes
    }
})

# Also handle OPTIONS requests explicitly
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', FRONTEND_URL)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Initialize sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

# ============================================
# PRODUCTION CONFIGURATION
# ============================================

# Get port from environment variable (for cloud platforms)
PORT = int(os.environ.get('PORT', 5000))

# Get environment
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

# Frontend path (for serving static files)
FRONTEND_PATH = os.environ.get('FRONTEND_PATH', '../frontend')

# ============================================
# STATIC FILE SERVING (for unified deployment)
# ============================================

@app.route('/')
def serve_index():
    """Serve the main index.html file"""
    try:
        # Try to serve from static folder first
        return send_from_directory('static', 'index.html')
    except:
        # Fallback to frontend path
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), FRONTEND_PATH)
        return send_from_directory(frontend_dir, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files (CSS, JS, images, HTML)"""
    try:
        # Try static folder first
        return send_from_directory('static', path)
    except:
        # Fallback to frontend path
        frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), FRONTEND_PATH)
        return send_from_directory(frontend_dir, path)

# ============================================
# API ENDPOINTS
# ============================================

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_sentiment():
    """
    Endpoint to analyze sentiment using VADER
    Expects JSON: {"text": "user input text"}
    """
    # Handle preflight requests explicitly
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', FRONTEND_URL)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '600')
        return response, 200
    
    try:
        # Get and validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload"}), 400
        
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Log in production-friendly way
        if ENVIRONMENT != 'production':
            print(f"🔄 Analyzing: {text[:50]}...")
        
        # Get VADER sentiment scores
        scores = analyzer.polarity_scores(text)
        
        # Extract sentiment based on compound score
        compound = scores['compound']  # Range: -1 to 1
        
        if compound >= 0.05:
            sentiment = 'positive'
        elif compound <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        # Map scores to emotion values (0-1 scale)
        pos = scores['pos']
        neg = scores['neg']
        
        emotions = {
            "anger": neg * 0.7,
            "disgust": neg * 0.6,
            "fear": neg * 0.4,
            "joy": pos * 0.9,
            "sadness": neg * 0.8,
            "surprise": 0.2
        }
        
        # Extract sentiment-driving keywords
        words = text.split()
        keywords = []
        
        if words:
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
            "keywords": keywords,
            "detailed_scores": {
                "positive": scores['pos'],
                "negative": scores['neg'],
                "neutral": scores['neu']
            }
        }
        
        if ENVIRONMENT != 'production':
            print(f"✅ Result: {sentiment.upper()} (score: {compound:.2f})")
        
        return jsonify(analysis), 200
        
    except Exception as e:
        print(f"❌ Server error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        if ENVIRONMENT == 'production':
            return jsonify({"error": "An internal server error occurred"}), 500
        else:
            return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint for monitoring"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', FRONTEND_URL)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,OPTIONS')
        return response, 200
    
    return jsonify({
        "status": "ok",
        "message": "Sentiment Analyzer API is running",
        "environment": ENVIRONMENT,
        "nltk_data_loaded": analyzer is not None
    }), 200

@app.route('/api/version', methods=['GET'])
def version_info():
    """Version information endpoint"""
    return jsonify({
        "version": "1.0.0",
        "name": "Sentiment Analyzer API",
        "analyzer": "VADER (Valence Aware Dictionary and sEntiment Reasoner)"
    }), 200

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    response = jsonify({"error": "Endpoint not found"})
    response.headers.add('Access-Control-Allow-Origin', FRONTEND_URL)
    return response, 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    response = jsonify({"error": "Internal server error"})
    response.headers.add('Access-Control-Allow-Origin', FRONTEND_URL)
    return response, 500

# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Sentiment Analyzer Backend Server")
    print("=" * 50)
    print(f"📍 Environment: {ENVIRONMENT}")
    print(f"📍 Server will run on: http://0.0.0.0:{PORT}")
    print(f"📍 API endpoint: http://0.0.0.0:{PORT}/api/analyze")
    print(f"📍 Health check: http://0.0.0.0:{PORT}/api/health")
    print(f"📍 CORS allowed origin: {FRONTEND_URL}")
    print(f"📍 Using VADER sentiment analyzer (no API calls needed)")
    print(f"✓ NLTK data: {'Loaded' if analyzer else 'Failed'}")
    print("=" * 50)
    print("Press Ctrl+C to stop the server")
    print("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=PORT,
        debug=(ENVIRONMENT == 'development'),
        threaded=True
    )
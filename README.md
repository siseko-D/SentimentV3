1. # Sentiment Analysis Dashboard

A powerful, free, and local sentiment analysis web application that uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for instant text analysis without any API costs or limitations.

![Sentiment Analysis Dashboard](images/sentiment_logo.jpg)

## 🚀 Features

- **Real-time Sentiment Analysis** - Analyze text sentiment (positive/negative/neutral) instantly
- **Multi-emotion Detection** - Detects 6 emotions: anger, disgust, fear, joy, sadness, surprise
- **Keyword Extraction** - Identifies sentiment-driving keywords from your text
- **Interactive Visualizations** - Bar charts, pie charts, and radar charts for emotion analysis
- **Batch Processing** - Upload .txt, .csv, or .json files for bulk analysis (up to 20 items)
- **Comparative Analysis** - Compare sentiment across multiple texts (up to 4 simultaneously)
- **Model Evaluation** - Test model accuracy with confusion matrix and performance metrics
- **Export Options** - Download reports in PDF, JSON, or CSV formats
- **Analysis History** - Local storage of all analyses with search and filter capabilities

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Tailwind CSS for styling
- Chart.js for data visualization
- jsPDF for PDF report generation

### Backend
- Python Flask
- NLTK VADER sentiment analyzer
- No external API dependencies - completely free!

## 📋 Prerequisites

- Python 3.7 or higher
- Modern web browser (Chrome, Firefox, Edge, Safari)
- pip (Python package installer)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/sentiment-analysis-dashboard.git
cd sentiment-analysis-dashboard

2. # Navigate to backend folder
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python backend.py4

3. Access the Application
Open your browser and navigate to the frontend folder

Open index.html directly or use a local server (like Live Server in VS Code)

The backend runs on http://127.0.0.1:5000

Project Structure
sentiment-analysis-dashboard/
├── backend/
│   ├── backend.py              # Flask server with VADER analyzer
│   ├── requirements.txt         # Python dependencies
│   └── BACKEND_SETUP.md         # Backend setup instructions
├── frontend/
│   ├── index.html               # Main dashboard
│   ├── about.html                # About page
│   ├── history.html              # History page
│   ├── css/
│   │   ├── style.css            # About page styles
│   │   ├── style_2.css          # Dashboard styles
│   │   └── style_3.css          # History page styles
│   ├── js/
│   │   ├── index.js             # Main application logic
│   │   └── history.js           # History page logic
│   └── images/
│       ├── sentiment_logo.jpg    # App logo
│       └── Siya.jpg              # Team member photo
├── .gitignore                    # Git ignore file
├── LICENSE                       # MIT License
└── README.md                     # This file

# 🎯 Usage
Single Text Analysis
1. Enter text in the input area
2. Click "Analyze Sentiment"
3. View results with emotion distribution and keywords

Batch Processing
1. Switch to "Batch Processing" tab
2. Upload a .txt, .csv, or .json file
3. Click "Analyze File" to process multiple texts

Comparative Analysis
1. Switch to "Comparative Analysis" tab
2. Add up to 4 texts
3. Compare sentiment scores and emotion profiles

Model Evaluation
1. Switch to "Model Evaluation" tab
2. Enter text and select true sentiment
3. Build evaluation dataset and calculate performance metrics

📊 API Endpoints
The backend server provides these REST endpoints:
GET /api/health - Health check
POST /api/analyze - Analyze sentiment (expects JSON with "text" field)

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

👤 Author
Siyamthanda Dlakavu
GitHub: @YOUR_USERNAME

🙏 Acknowledgments
NLTK VADER for sentiment analysis
Chart.js for beautiful charts
Tailwind CSS for styling
Font Awesome for icons

📧 Contact
For questions or feedback, please open an issue on GitHub.

Made with ❤️ by Siyamthanda Dlakavu
document.addEventListener("DOMContentLoaded", () => {
    // --- Constants and Configuration ---
    // =================================================================================
    // === BACKEND SERVER CONFIGURATION ==========================================
    // =================================================================================
    // For local development:
    // const BACKEND_URL = "http://127.0.0.1:5000";
    
    // For production (Render) - REPLACE THIS WITH YOUR ACTUAL RENDER URL AFTER DEPLOYMENT
    const BACKEND_URL = "https://sentiment-analyzer-backend-ywc6.onrender.com";
    
    const API_ENDPOINT = `${BACKEND_URL}/api/analyze`;
    const HEALTH_CHECK_URL = `${BACKEND_URL}/api/health`;
    // =================================================================================

    // --- Caching DOM Elements ---
    const DOMElements = {
        textInput: document.getElementById("text-input"),
        analyzeButton: document.getElementById("analyze-button"),
        buttonText: document.getElementById("button-text"),
        loadingIndicator: document.getElementById("loading-indicator"),
        resultsSection: document.getElementById("results-section"),
        overallSentimentSpan: document.getElementById("overall-sentiment"),
        sentimentScoreSpan: document.getElementById("sentiment-score"),
        emotionalToneSpan: document.getElementById("emotional-tone"),
        emotionsContainer: document.getElementById("emotions-container"),
        keywordsContainer: document.getElementById("keywords-container"),
        sentimentResultBox: document.getElementById("sentiment-result"),
        errorMessageDiv: document.getElementById("error-message"),
        errorTextSpan: document.getElementById("error-text"),
        clearButton: document.getElementById("clear-button"),
        downloadReportButton: document.getElementById("download-report-button"),
        downloadOptions: document.getElementById("download-options"),
        downloadButtonWrapper: document.getElementById("download-button-wrapper"),
        compareTab: document.getElementById("compare-tab"),
        compareSection: document.getElementById("compare-section"),
        compareInputsContainer: document.getElementById("compare-inputs-container"),
        addCompareInputBtn: document.getElementById("add-compare-input"),
        analyzeCompareButton: document.getElementById("analyze-compare-button"),
        compareButtonText: document.getElementById("compare-button-text"),
        compareLoadingIndicator: document.getElementById("compare-loading-indicator"),
        compareResults: document.getElementById("compare-results"),
        compareErrorMessageDiv: document.getElementById("compare-error-message"),
        compareErrorTextSpan: document.getElementById("compare-error-text"),

        // File upload elements
        fileInput: document.getElementById("file-input"),
        fileUploadContainer: document.getElementById("file-upload-container"),
        fileInfo: document.getElementById("file-info"),
        analyzeFileButton: document.getElementById("analyze-file-button"),
        fileButtonText: document.getElementById("file-button-text"),
        fileLoadingIndicator: document.getElementById("file-loading-indicator"),
        batchResults: document.getElementById("batch-results"),
        batchResultsList: document.getElementById("batch-results-list"),

        // Tab elements
        textTab: document.getElementById("text-tab"),
        fileTab: document.getElementById("file-tab"),
        evaluationTab: document.getElementById("evaluation-tab"),
        textInputSection: document.getElementById("text-input-section"),
        fileUploadSection: document.getElementById("file-upload-section"),
        evaluationSection: document.getElementById("evaluation-section"),
        tabButtons: document.querySelectorAll(".tab-button"),
        tabContents: document.querySelectorAll(".tab-content"),

        // Visualization Tabs (internal to results-section)
        vizTabButtons: document.querySelectorAll(".visualization-tabs .tab-button"),
        vizTabContents: document.querySelectorAll('.results-section .tab-content[id$="chart"]'),

        // Model Evaluation DOM Elements
        evalTextInput: document.getElementById("eval-text-input"),
        trueSentimentSelect: document.getElementById("true-sentiment-select"),
        addToEvalButton: document.getElementById("add-to-eval-button"),
        evalButtonText: document.getElementById("eval-button-text"),
        evalLoadingIndicator: document.getElementById("eval-loading-indicator"),
        evaluationDataList: document.getElementById("evaluation-data-list"),
        evalList: document.getElementById("eval-list"),
        calculateMetricsButton: document.getElementById("calculate-metrics-button"),
        metricsResultsSection: document.getElementById("metrics-results-section"),
        accuracyScoreSpan: document.getElementById("accuracy-score"),
        posPrecisionSpan: document.getElementById("pos-precision"),
        posRecallSpan: document.getElementById("pos-recall"),
        posF1Span: document.getElementById("pos-f1"),
        negPrecisionSpan: document.getElementById("neg-precision"),
        negRecallSpan: document.getElementById("neg-recall"),
        negF1Span: document.getElementById("neg-f1"),
        neuPrecisionSpan: document.getElementById("neu-precision"),
        neuRecallSpan: document.getElementById("neu-recall"),
        neuF1Span: document.getElementById("neu-f1"),
        evalErrorMessageDiv: document.getElementById("eval-error-message"),
        evalErrorTextSpan: document.getElementById("eval-error-text")
    };

    let emotionBarChart, emotionPieChart, emotionRadarChart;
    let currentFile = null;
    let evaluationData = [];
    let lastAnalysisResult = null;
    let compareBarChart, compareRadarChart;
    let batchResults = [];
    const BATCH_ANALYSIS_LIMIT = 20;

    // --- Utility Functions ---
    function showLoading(buttonTextElement, loadingIndicatorElement) {
        buttonTextElement.classList.add("hidden");
        loadingIndicatorElement.classList.remove("hidden");
        loadingIndicatorElement.classList.add("animate-pulse");
    }

    function hideLoading(buttonTextElement, loadingIndicatorElement) {
        buttonTextElement.classList.remove("hidden");
        loadingIndicatorElement.classList.add("hidden");
        loadingIndicatorElement.classList.remove("animate-pulse");
    }

    function displayError(message, errorDiv, errorTextSpan) {
        errorTextSpan.textContent = message;
        errorDiv.classList.remove("hidden");
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function hideError(errorDiv) {
        errorDiv.classList.add("hidden");
        const errorText = errorDiv.querySelector("p:last-child");
        if (errorText) {
            errorText.textContent = "";
        }
    }

    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    }

    async function handleFileAnalysis() {
        if (!currentFile) {
            displayError(
                "Please select a file first.",
                DOMElements.errorMessageDiv,
                DOMElements.errorTextSpan
            );
            return;
        }

        showLoading(DOMElements.fileButtonText, DOMElements.fileLoadingIndicator);
        hideError(DOMElements.errorMessageDiv);
        DOMElements.batchResults.classList.add("hidden");
        DOMElements.batchResultsList.innerHTML = "";

        try {
            const fileText = await readFileAsText(currentFile);
            const lines = fileText
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "");

            if (lines.length === 0) {
                throw new Error("File is empty or contains no valid text lines.");
            }

            const linesToProcess = lines.slice(0, BATCH_ANALYSIS_LIMIT);
            const results = [];

            for (const line of linesToProcess) {
                try {
                    const analysis = await getSentimentAnalysis(line);
                    results.push({
                        text: line,
                        sentiment: analysis.overall_sentiment,
                        confidence: analysis.sentiment_score,
                        emotions: analysis.emotions,
                        evaluation_score: analysis.sentiment_score
                    });
                } catch (error) {
                    console.error(`Error analyzing line: "${line.substring(0, 50)}..."`, error);
                    results.push({
                        text: line,
                        error: true,
                        message: error.message,
                        overall_sentiment: "error",
                        sentiment_score: 0,
                        emotions: {}
                    });
                }
                await delay(300);
            }

            if (results.length > 0) {
                generateFileResultsHTML(results);
                DOMElements.batchResults.classList.remove("hidden");

                saveToHistory(
                    {
                        overall_sentiment: results[0].sentiment || "neutral",
                        sentiment_score: results[0].confidence || 0,
                        emotions: results[0].emotions || {},
                        keywords: []
                    },
                    `Batch analysis (${results.length} items)`,
                    true,
                    results
                );
            } else {
                throw new Error("No valid results generated from the file.");
            }
        } catch (error) {
            displayError(
                `Error processing file: ${error.message}`,
                DOMElements.errorMessageDiv,
                DOMElements.errorTextSpan
            );
        } finally {
            hideLoading(DOMElements.fileButtonText, DOMElements.fileLoadingIndicator);
        }
    }

    function generateFileResultsHTML(results) {
        const resultsList = DOMElements.batchResultsList;
        resultsList.innerHTML = "";

        if (results.length === 0) {
            resultsList.innerHTML = '<p class="text-gray-500">No analysis results to display.</p>';
            return;
        }

        results.forEach((result, index) => {
            const listItem = document.createElement("div");
            listItem.className = "bg-gray-50 p-4 rounded-lg shadow-sm mb-3";
            let sentimentText = "N/A";
            let sentimentClass = "text-gray-700";

            if (result.sentiment) {
                sentimentText = result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1);
                if (result.sentiment === "positive") sentimentClass = "text-green-600 font-semibold";
                else if (result.sentiment === "negative") sentimentClass = "text-red-600 font-semibold";
                else if (result.sentiment === "neutral") sentimentClass = "text-blue-600 font-semibold";
            }

            listItem.innerHTML = `
                <p class="text-sm text-gray-500 mb-1">Line ${index + 1}:</p>
                <p class="text-lg mb-2"><strong class="text-gray-800">Sentiment:</strong> <span class="${sentimentClass}">${sentimentText}</span></p>
                <p class="text-md text-gray-700">Confidence: ${(result.confidence * 100).toFixed(2)}%</p>
                <p class="text-md text-gray-700">Evaluation Score: ${result.evaluation_score !== null ? result.evaluation_score : "N/A"}</p>
                <div class="mt-2 text-sm text-gray-600">
                    <strong>Emotions:</strong>
                    ${Object.entries(result.emotions || {})
                        .map(([key, value]) => `<span>${key.charAt(0).toUpperCase() + key.slice(1)}: ${(value * 100).toFixed(0)}% </span>`)
                        .join("")}
                </div>
            `;
            resultsList.appendChild(listItem);
        });
    }

    function resetUI() {
        DOMElements.textInput.value = "";
        DOMElements.resultsSection.classList.add("hidden");
        DOMElements.clearButton.classList.add("hidden");
        DOMElements.downloadButtonWrapper.classList.add("hidden");
        DOMElements.downloadOptions.classList.add("hidden");
        hideError(DOMElements.errorMessageDiv);
        resetMetricsDisplay();
        currentFile = null;
        DOMElements.fileInfo.classList.add("hidden");
        DOMElements.fileInfo.textContent = "";
        DOMElements.analyzeFileButton.disabled = true;
        DOMElements.batchResults.classList.add("hidden");
        DOMElements.batchResultsList.innerHTML = "";
        if (emotionBarChart) emotionBarChart.destroy();
        if (emotionPieChart) emotionPieChart.destroy();
        if (emotionRadarChart) emotionRadarChart.destroy();
        lastAnalysisResult = null;
        DOMElements.tabButtons.forEach((btn) => btn.classList.remove("active"));
        DOMElements.tabContents.forEach((content) => content.classList.remove("active"));
        DOMElements.textTab.classList.add("active");
        DOMElements.textInputSection.classList.add("active");
    }

    function setupComparativeAnalysis() {
        DOMElements.addCompareInputBtn.addEventListener("click", () => {
            const inputCount = document.querySelectorAll(".compare-input-group").length;
            if (inputCount >= 4) {
                displayError(
                    "Maximum of 4 texts can be compared at once.",
                    DOMElements.compareErrorMessageDiv,
                    DOMElements.compareErrorTextSpan
                );
                return;
            }

            const newInputGroup = document.createElement("div");
            newInputGroup.className = "compare-input-group mb-4";
            newInputGroup.innerHTML = `
                <label class="block text-gray-700 text-lg font-semibold mb-2">Text ${inputCount + 1}:</label>
                <textarea class="compare-text-input w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                          placeholder="Enter text to compare" rows="3"></textarea>
                <button class="remove-compare-input bg-red-500 text-white py-1 px-3 rounded-lg text-sm mt-2">Remove</button>
            `;

            DOMElements.compareInputsContainer.appendChild(newInputGroup);

            if (inputCount >= 1) {
                document
                    .querySelectorAll(".remove-compare-input")
                    .forEach((btn) => btn.classList.remove("hidden"));
            }
        });

        DOMElements.compareInputsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-compare-input")) {
                const inputGroup = e.target.closest(".compare-input-group");
                inputGroup.remove();

                document.querySelectorAll(".compare-input-group").forEach((group, index) => {
                    group.querySelector("label").textContent = `Text ${index + 1}:`;
                });

                if (document.querySelectorAll(".compare-input-group").length <= 1) {
                    document.querySelector(".remove-compare-input").classList.add("hidden");
                }
            }
        });

        DOMElements.analyzeCompareButton.addEventListener("click", analyzeComparison);
    }

    async function analyzeComparison() {
        const textInputs = document.querySelectorAll(".compare-text-input");
        const texts = Array.from(textInputs)
            .map((input) => input.value.trim())
            .filter((text) => text !== "");

        if (texts.length < 2) {
            displayError(
                "Please enter at least 2 texts to compare.",
                DOMElements.compareErrorMessageDiv,
                DOMElements.compareErrorTextSpan
            );
            return;
        }

        showLoading(DOMElements.compareButtonText, DOMElements.compareLoadingIndicator);
        DOMElements.compareResults.classList.add("hidden");
        hideError(DOMElements.compareErrorMessageDiv);

        try {
            const analyses = [];

            for (const text of texts) {
                try {
                    const analysis = await getSentimentAnalysis(text);
                    analyses.push(analysis);
                    console.log(`Analysis completed for text: ${text.substring(0, 50)}...`);
                } catch (error) {
                    console.error(`Error analyzing text: ${text.substring(0, 50)}...`, error);
                    analyses.push({
                        error: true,
                        message: error.message,
                        text: text,
                        overall_sentiment: "error",
                        sentiment_score: 0,
                        emotions: {}
                    });
                }
            }
            displayComparisonResults(texts, analyses);
        } catch (error) {
            displayError(
                `Error during comparison: ${error.message}`,
                DOMElements.compareErrorMessageDiv,
                DOMElements.compareErrorTextSpan
            );
        } finally {
            hideLoading(DOMElements.compareButtonText, DOMElements.compareLoadingIndicator);
        }
    }

    function displayComparisonResults(texts, analyses) {
        for (let i = 1; i <= 4; i++) {
            const header = document.getElementById(`compare-header-${i}`);
            const sentimentCell = document.getElementById(`compare-sentiment-${i}`);
            const scoreCell = document.getElementById(`compare-score-${i}`);
            const emotionCell = document.getElementById(`compare-emotion-${i}`);

            if (i <= texts.length) {
                header.classList.remove("hidden");
                sentimentCell.classList.remove("hidden");
                scoreCell.classList.remove("hidden");
                emotionCell.classList.remove("hidden");

                const displayText = texts[i - 1].length > 20 ? texts[i - 1].substring(0, 17) + "..." : texts[i - 1];
                header.textContent = displayText;
            } else {
                header.classList.add("hidden");
                sentimentCell.classList.add("hidden");
                scoreCell.classList.add("hidden");
                emotionCell.classList.add("hidden");
            }
        }

        analyses.forEach((analysis, index) => {
            const sentimentCell = document.getElementById(`compare-sentiment-${index + 1}`);
            const scoreCell = document.getElementById(`compare-score-${index + 1}`);
            const emotionCell = document.getElementById(`compare-emotion-${index + 1}`);

            if (analysis.error) {
                sentimentCell.textContent = "Error";
                scoreCell.textContent = "N/A";
                emotionCell.textContent = "N/A";
                console.error(`Error for text ${index + 1}:`, analysis.message);
            } else {
                sentimentCell.textContent = analysis.overall_sentiment.charAt(0).toUpperCase() + analysis.overall_sentiment.slice(1);
                scoreCell.textContent = analysis.sentiment_score.toFixed(2);

                const emotions = analysis.emotions;
                if (emotions && Object.keys(emotions).length > 0) {
                    const dominantEmotion = Object.entries(emotions).reduce((a, b) => a[1] > b[1] ? a : b)[0];
                    emotionCell.textContent = dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1);
                } else {
                    emotionCell.textContent = "N/A";
                }
            }
        });

        updateComparisonCharts(analyses);
        DOMElements.compareResults.classList.remove("hidden");
    }

    function updateComparisonCharts(analyses) {
        if (compareBarChart) compareBarChart.destroy();
        if (compareRadarChart) compareRadarChart.destroy();

        const labels = analyses.map((_, i) => `Text ${i + 1}`);
        const sentimentScores = analyses.map((a) => a.sentiment_score);

        const allEmotions = new Set();
        analyses.forEach((a) => {
            if (a.emotions) {
                Object.keys(a.emotions).forEach((emotion) => allEmotions.add(emotion));
            }
        });
        const emotionLabels = Array.from(allEmotions);

        const radarDatasets = analyses.map((a, i) => {
            const emotionValues = emotionLabels.map((emotion) =>
                a.emotions && a.emotions[emotion] ? a.emotions[emotion] * 100 : 0
            );
            return {
                label: `Text ${i + 1}`,
                data: emotionValues,
                backgroundColor: getColorForIndex(i, 0.2),
                borderColor: getColorForIndex(i),
                borderWidth: 2,
                pointBackgroundColor: getColorForIndex(i),
                pointBorderColor: "#fff",
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: getColorForIndex(i)
            };
        });

        const barCtx = document.getElementById("compareBarChart").getContext("2d");
        compareBarChart = new Chart(barCtx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Sentiment Score",
                    data: sentimentScores,
                    backgroundColor: labels.map((_, i) => getColorForIndex(i, 0.7)),
                    borderColor: labels.map((_, i) => getColorForIndex(i)),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: false, min: -1, max: 1 } },
                plugins: { legend: { display: false } }
            }
        });

        const radarCtx = document.getElementById("compareRadarChart").getContext("2d");
        compareRadarChart = new Chart(radarCtx, {
            type: "radar",
            data: {
                labels: emotionLabels.map((e) => e.charAt(0).toUpperCase() + e.slice(1)),
                datasets: radarDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { r: { beginAtZero: true, max: 100 } }
            }
        });
    }

    function getColorForIndex(index, opacity = 1) {
        const colors = [
            `rgba(75, 192, 192, ${opacity})`,
            `rgba(255, 99, 132, ${opacity})`,
            `rgba(54, 162, 235, ${opacity})`,
            `rgba(255, 206, 86, ${opacity})`
        ];
        return colors[index % colors.length];
    }

    function saveToHistory(analysisData, title = "Single text analysis", isBatch = false, batchItems = []) {
        const historyItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            title: title,
            text: analysisData.text || "",
            overall_sentiment: analysisData.overall_sentiment,
            sentiment_score: analysisData.sentiment_score,
            emotions: analysisData.emotions,
            keywords: analysisData.keywords,
            isBatch: isBatch
        };

        if (isBatch) {
            historyItem.items = batchItems;
            historyItem.positiveCount = batchItems.filter((item) => item.sentiment === "positive").length;
            historyItem.negativeCount = batchItems.filter((item) => item.sentiment === "negative").length;
            historyItem.neutralCount = batchItems.filter((item) => item.sentiment === "neutral").length;
        }

        const history = JSON.parse(localStorage.getItem("sentimentAnalysisHistory")) || [];
        history.unshift(historyItem);
        localStorage.setItem("sentimentAnalysisHistory", JSON.stringify(history));
    }

    function resetMetricsDisplay() {
        evaluationData = [];
        DOMElements.evalList.innerHTML = "";
        DOMElements.evaluationDataList.classList.add("hidden");
        DOMElements.calculateMetricsButton.classList.add("hidden");
        DOMElements.metricsResultsSection.classList.add("hidden");
        hideError(DOMElements.evalErrorMessageDiv);

        document.getElementById("cm-pp").textContent = 0;
        document.getElementById("cm-pn").textContent = 0;
        document.getElementById("cm-p-neu").textContent = 0;
        document.getElementById("cm-np").textContent = 0;
        document.getElementById("cm-nn").textContent = 0;
        document.getElementById("cm-n-neu").textContent = 0;
        document.getElementById("cm-neu-p").textContent = 0;
        document.getElementById("cm-neu-n").textContent = 0;
        document.getElementById("cm-neu-neu").textContent = 0;

        DOMElements.accuracyScoreSpan.textContent = "N/A";
        DOMElements.posPrecisionSpan.textContent = "N/A";
        DOMElements.posRecallSpan.textContent = "N/A";
        DOMElements.posF1Span.textContent = "N/A";
        DOMElements.negPrecisionSpan.textContent = "N/A";
        DOMElements.negRecallSpan.textContent = "N/A";
        DOMElements.negF1Span.textContent = "N/A";
        DOMElements.neuPrecisionSpan.textContent = "N/A";
        DOMElements.neuRecallSpan.textContent = "N/A";
        DOMElements.neuF1Span.textContent = "N/A";
    }

    function getChartImage(chartId) {
        try {
            let imageData = null;

            if (chartId === "emotionBarChart" && emotionBarChart) {
                imageData = emotionBarChart.toBase64Image("image/jpeg", 0.95);
                console.log("✓ Bar chart captured, size:", imageData.length);
            } else if (chartId === "emotionPieChart" && emotionPieChart) {
                imageData = emotionPieChart.toBase64Image("image/jpeg", 0.95);
                console.log("✓ Pie chart captured, size:", imageData.length);
            } else if (chartId === "emotionRadarChart" && emotionRadarChart) {
                imageData = emotionRadarChart.toBase64Image("image/jpeg", 0.95);
                console.log("✓ Radar chart captured, size:", imageData.length);
            }

            if (!imageData) {
                const chartCanvas = document.getElementById(chartId);
                if (chartCanvas && chartCanvas.toDataURL) {
                    imageData = chartCanvas.toDataURL("image/jpeg", 0.95);
                    console.log("✓ Canvas fallback used for", chartId);
                }
            }

            return imageData;
        } catch (error) {
            console.error(`Error getting chart image for ${chartId}:`, error);
        }
        return null;
    }

    // --- API Interaction ---
    async function getSentimentAnalysis(text) {
        try {
            console.log("🔄 Sending request to backend server...");
            console.log("📍 Backend URL:", API_ENDPOINT);
            console.log("📝 Text:", text);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Backend request timed out after 30 seconds.")), 30000)
            );

            const apiCall = fetch(API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: text })
            }).then(async response => {
                console.log("🔄 Got response status:", response.status);
                const responseText = await response.text();
                console.log("📝 Raw response:", responseText.substring(0, 300) + "...");

                if (!response.ok) {
                    throw new Error(`Backend Error ${response.status}: ${responseText}`);
                }

                try {
                    return JSON.parse(responseText);
                } catch (e) {
                    throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
                }
            });

            const result = await Promise.race([apiCall, timeoutPromise]);
            console.log("🔄 Parsed result:", result);

            if (!result) {
                throw new Error("Empty response from backend");
            }

            if (result.error) {
                throw new Error(result.error);
            }

            if (!result.overall_sentiment || !result.emotions || !result.keywords) {
                console.error("❌ Invalid response structure:", result);
                throw new Error("Backend response missing required fields: overall_sentiment, emotions, or keywords");
            }

            console.log("✅ Analysis successful");
            return result;

        } catch (error) {
            console.error("❌ Error:", error);
            const errorMsg = error.message || "Unknown error";

            if (errorMsg.includes("Failed to fetch") || errorMsg.includes("CORS")) {
                throw new Error("Cannot connect to backend server. Make sure the backend is running and CORS is configured.");
            }

            if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
                throw new Error("Backend authentication error.");
            }

            throw new Error(errorMsg);
        }
    }

    // --- UI Update Functions ---
    function displaySentimentResults(data) {
        try {
            const { overall_sentiment, sentiment_score, emotions, keywords } = data;

            console.log("Displaying results:", { overall_sentiment, sentiment_score, emotions, keywords });

            if (!overall_sentiment || !emotions || !Array.isArray(keywords)) {
                throw new Error("Invalid data structure in displaySentimentResults");
            }

            data.text = DOMElements.textInput.value.trim();
            saveToHistory(data);

            DOMElements.overallSentimentSpan.textContent =
                overall_sentiment.charAt(0).toUpperCase() + overall_sentiment.slice(1);

            const numScore = typeof sentiment_score === 'string' ? parseFloat(sentiment_score) : sentiment_score;
            DOMElements.sentimentScoreSpan.textContent = numScore.toFixed(2);

            DOMElements.sentimentResultBox.className = "result-box";
            DOMElements.sentimentResultBox.classList.add(overall_sentiment);

            const sortedEmotions = Object.entries(emotions).sort(([, a], [, b]) => b - a);
            DOMElements.emotionalToneSpan.textContent =
                sortedEmotions.length > 0
                    ? sortedEmotions[0][0].charAt(0).toUpperCase() + sortedEmotions[0][0].slice(1)
                    : "N/A";

            DOMElements.emotionsContainer.innerHTML = "";
            for (const [emotion, score] of sortedEmotions) {
                if (score > 0) {
                    const emotionTag = document.createElement("span");
                    emotionTag.className = "emotion-tag";
                    emotionTag.textContent = `${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${(score * 100).toFixed(0)}%)`;
                    DOMElements.emotionsContainer.appendChild(emotionTag);
                }
            }

            DOMElements.keywordsContainer.innerHTML = "";
            if (keywords && Array.isArray(keywords)) {
                keywords.forEach((kw) => {
                    const keywordSpan = document.createElement("span");
                    keywordSpan.className = `inline-block px-3 py-1 rounded-full text-sm font-semibold mr-2 mb-2
                                             ${kw.sentiment === "positive"
                                                ? "bg-green-200 text-green-800"
                                                : kw.sentiment === "negative"
                                                    ? "bg-red-200 text-red-800"
                                                    : "bg-gray-200 text-gray-800"
                                            }`;
                    keywordSpan.textContent = `${kw.keyword} (${(kw.relevance * 100).toFixed(0)}%)`;
                    DOMElements.keywordsContainer.appendChild(keywordSpan);
                });
            }

            updateCharts(emotions);

            DOMElements.resultsSection.classList.remove("hidden");
            DOMElements.clearButton.classList.remove("hidden");
            DOMElements.downloadButtonWrapper.classList.remove("hidden");
            lastAnalysisResult = data;

            console.log("✓ Results displayed successfully");
        } catch (error) {
            console.error("Error displaying results:", error);
            displayError(
                "Error displaying results: " + error.message,
                DOMElements.errorMessageDiv,
                DOMElements.errorTextSpan
            );
        }
    }

    function updateCharts(emotions) {
        const emotionLabels = Object.keys(emotions);
        const emotionData = Object.values(emotions).map((score) => score * 100);

        if (emotionBarChart) emotionBarChart.destroy();
        if (emotionPieChart) emotionPieChart.destroy();
        if (emotionRadarChart) emotionRadarChart.destroy();

        const barCtx = document.getElementById("emotionBarChart").getContext("2d");
        const barCanvas = document.getElementById("emotionBarChart");
        barCanvas.style.backgroundColor = "white";
        emotionBarChart = new Chart(barCtx, {
            type: "bar",
            data: {
                labels: emotionLabels,
                datasets: [{
                    label: "Emotion Intensity (%)",
                    data: emotionData,
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
                    borderColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                backgroundColor: "white",
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: "rgba(0,0,0,0.1)" } },
                    x: { grid: { display: false } }
                },
                plugins: { legend: { display: false } }
            }
        });

        const pieCtx = document.getElementById("emotionPieChart").getContext("2d");
        const pieCanvas = document.getElementById("emotionPieChart");
        pieCanvas.style.backgroundColor = "white";
        emotionPieChart = new Chart(pieCtx, {
            type: "pie",
            data: {
                labels: emotionLabels,
                datasets: [{
                    data: emotionData,
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                backgroundColor: "white",
                plugins: {
                    legend: { position: "right", labels: { padding: 15, font: { size: 12 } } }
                }
            }
        });

        const radarCtx = document.getElementById("emotionRadarChart").getContext("2d");
        const radarCanvas = document.getElementById("emotionRadarChart");
        radarCanvas.style.backgroundColor = "white";
        emotionRadarChart = new Chart(radarCtx, {
            type: "radar",
            data: {
                labels: emotionLabels,
                datasets: [{
                    label: "Emotion Profile",
                    data: emotionData,
                    backgroundColor: "rgba(75, 192, 192, 0.25)",
                    borderColor: "#1E40AF",
                    borderWidth: 2,
                    pointBackgroundColor: "#1E40AF",
                    pointBorderColor: "#1E40AF",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "#1E40AF",
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                backgroundColor: "white",
                scales: { r: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // --- Tab Management ---
    function setupMainTabs() {
        DOMElements.tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                DOMElements.tabButtons.forEach((btn) => btn.classList.remove("active"));
                DOMElements.tabContents.forEach((content) => content.classList.remove("active"));

                button.classList.add("active");
                document.getElementById(button.dataset.tab).classList.add("active");
            });
        });
    }

    function setupVizTabs() {
        DOMElements.vizTabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                DOMElements.vizTabButtons.forEach((btn) => btn.classList.remove("active"));
                DOMElements.vizTabContents.forEach((content) => content.classList.remove("active"));

                button.classList.add("active");
                document.getElementById(button.dataset.tab).classList.add("active");
            });
        });
    }

    // --- File Upload Setup ---
    function setupFileUpload() {
        const handleFile = (file) => {
            if (!file) return;

            const validTypes = ["text/plain", "text/csv", "application/json"];
            if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|csv|json)$/i)) {
                displayError(
                    "Please upload a text file (.txt, .csv, or .json)",
                    DOMElements.errorMessageDiv,
                    DOMElements.errorTextSpan
                );
                return;
            }

            currentFile = file;
            DOMElements.fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            DOMElements.fileInfo.classList.remove("hidden");
            DOMElements.analyzeFileButton.disabled = false;
            hideError(DOMElements.errorMessageDiv);
            DOMElements.batchResults.classList.add("hidden");
            DOMElements.batchResultsList.innerHTML = "";
        };

        DOMElements.fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));
        DOMElements.fileUploadContainer.addEventListener("dragover", (e) => {
            e.preventDefault();
            DOMElements.fileUploadContainer.classList.add("drag-over");
        });
        DOMElements.fileUploadContainer.addEventListener("dragleave", () =>
            DOMElements.fileUploadContainer.classList.remove("drag-over")
        );
        DOMElements.fileUploadContainer.addEventListener("drop", (e) => {
            e.preventDefault();
            DOMElements.fileUploadContainer.classList.remove("drag-over");
            handleFile(e.dataTransfer.files[0]);
        });
    }

    async function analyzeBatch() {
        if (!currentFile) {
            displayError(
                "Please select a file first.",
                DOMElements.errorMessageDiv,
                DOMElements.errorTextSpan
            );
            return;
        }

        showLoading(DOMElements.fileButtonText, DOMElements.fileLoadingIndicator);
        hideError(DOMElements.errorMessageDiv);
        DOMElements.batchResultsList.innerHTML = "";
        DOMElements.batchResults.classList.remove("hidden");

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            let lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

            if (lines.length > BATCH_ANALYSIS_LIMIT) {
                displayError(
                    `File contains ${lines.length} entries. Processing only the first ${BATCH_ANALYSIS_LIMIT} for demonstration.`,
                    DOMElements.errorMessageDiv,
                    DOMElements.errorTextSpan
                );
                lines = lines.slice(0, BATCH_ANALYSIS_LIMIT);
            }

            batchResults = [];

            for (const line of lines) {
                const listItem = document.createElement("div");
                listItem.className = "batch-result-item flex items-center justify-between py-2";

                const textSpan = document.createElement("span");
                textSpan.textContent = line.length > 50 ? line.substring(0, 47) + "..." : line;
                textSpan.className = "text-gray-700 truncate flex-grow";

                const sentimentSpan = document.createElement("span");
                sentimentSpan.className = "ml-4 px-3 py-1 rounded-full text-xs font-semibold";
                sentimentSpan.textContent = "Analyzing...";
                sentimentSpan.classList.add("bg-gray-200", "text-gray-800");

                listItem.appendChild(textSpan);
                listItem.appendChild(sentimentSpan);
                DOMElements.batchResultsList.appendChild(listItem);
                DOMElements.batchResultsList.scrollTop = DOMElements.batchResultsList.scrollHeight;

                try {
                    const result = await getSentimentAnalysis(line);
                    sentimentSpan.textContent =
                        result.overall_sentiment.charAt(0).toUpperCase() +
                        result.overall_sentiment.slice(1);
                    sentimentSpan.classList.remove("bg-gray-200", "text-gray-800");
                    sentimentSpan.classList.add(
                        result.overall_sentiment === "positive"
                            ? "bg-green-200 text-green-800"
                            : result.overall_sentiment === "negative"
                                ? "bg-red-200 text-red-800"
                                : "bg-yellow-200 text-yellow-800"
                    );
                    batchResults.push({
                        text: line,
                        sentiment: result.overall_sentiment,
                        score: result.sentiment_score
                    });
                } catch (error) {
                    sentimentSpan.textContent = "Error" + error.message.substring(0, 30) + "...";
                    sentimentSpan.classList.remove("bg-gray-200", "text-gray-800");
                    sentimentSpan.classList.add("bg-red-200", "text-red-800");
                    console.error(`Error analyzing line "${line}":`, error);
                }
            }

            if (batchResults.length > 0) {
                const batchTitle = `Batch analysis (${batchResults.length} items)`;
                const firstItem = batchResults[0];
                saveToHistory(
                    {
                        overall_sentiment: firstItem.sentiment,
                        sentiment_score: firstItem.score,
                        emotions: {},
                        keywords: []
                    },
                    batchTitle,
                    true,
                    batchResults
                );
            }
            hideLoading(DOMElements.fileButtonText, DOMElements.fileLoadingIndicator);
        };
        reader.onerror = () => {
            displayError("Failed to read file.", DOMElements.errorMessageDiv, DOMElements.errorTextSpan);
            hideLoading(DOMElements.fileButtonText, DOMElements.fileLoadingIndicator);
        };
        reader.readAsText(currentFile);
    }

    // --- Download Functions ---
    function showDownloadOptions() {
        DOMElements.downloadOptions.classList.toggle("hidden");
    }

    async function generatePDFReport(analysisData) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPos = margin;

            doc.setFontSize(28);
            doc.setTextColor(30, 64, 175);
            doc.text("Sentiment Analysis Report", pageWidth / 2, yPos, { align: "center" });
            yPos += 15;

            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(1.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;

            doc.setFillColor(230, 240, 255);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 50, "F");

            doc.setFontSize(14);
            doc.setFont(undefined, "bold");
            doc.setTextColor(30, 64, 175);
            doc.text("Analysis Summary", margin + 5, yPos + 6);

            doc.setFontSize(11);
            doc.setFont(undefined, "normal");
            doc.setTextColor(0, 0, 0);

            const sentimentText = analysisData.overall_sentiment.charAt(0).toUpperCase() + analysisData.overall_sentiment.slice(1);
            const scoreText = analysisData.sentiment_score.toFixed(3);

            doc.text(`Overall Sentiment: ${sentimentText}`, margin + 10, yPos + 15);
            doc.text(`Sentiment Score: ${scoreText}`, margin + 10, yPos + 22);
            doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 10, yPos + 29);

            yPos += 60;

            doc.setFontSize(16);
            doc.setFont(undefined, "bold");
            doc.setTextColor(30, 64, 175);
            doc.text("1. Overall Sentiment Analysis", margin, yPos);
            yPos += 8;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont(undefined, "normal");
            doc.setTextColor(0, 0, 0);

            const overallSentimentData = [
                ["Sentiment Classification", sentimentText],
                ["Sentiment Score", scoreText],
                ["Score Range", "-1.0 (Very Negative) to +1.0 (Very Positive)"],
                ["Emotional Tone", DOMElements.emotionalToneSpan ? DOMElements.emotionalToneSpan.textContent : "Neutral"]
            ];

            doc.autoTable({
                startY: yPos,
                head: [["Metric", "Value"]],
                body: overallSentimentData,
                theme: "grid",
                styles: { fontSize: 10, cellPadding: 4, halign: "left" },
                headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 11 },
                bodyStyles: { alternateRowStyles: { fillColor: [245, 245, 245] } },
                margin: { left: margin, right: margin },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: pageWidth - 2 * margin - 80 }
                }
            });

            yPos = doc.lastAutoTable.finalY + 12;

            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(16);
            doc.setFont(undefined, "bold");
            doc.setTextColor(30, 64, 175);
            doc.text("2. Emotion Intensity Analysis", margin, yPos);
            yPos += 8;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            const emotionRows = Object.entries(analysisData.emotions)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, score]) => [
                    emotion.charAt(0).toUpperCase() + emotion.slice(1),
                    (score * 100).toFixed(1) + "%"
                ]);

            doc.autoTable({
                startY: yPos,
                head: [["Emotion", "Intensity"]],
                body: emotionRows,
                theme: "grid",
                styles: { fontSize: 10, cellPadding: 4, halign: "left" },
                headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 11 },
                bodyStyles: { alternateRowStyles: { fillColor: [245, 245, 245] } },
                margin: { left: margin, right: margin },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: pageWidth - 2 * margin - 80, halign: "right" }
                }
            });

            yPos = doc.lastAutoTable.finalY + 12;

            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(16);
            doc.setFont(undefined, "bold");
            doc.setTextColor(30, 64, 175);
            doc.text("3. Sentiment-Driving Keywords", margin, yPos);
            yPos += 8;

            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            const keywordRows = analysisData.keywords
                .sort((a, b) => b.relevance - a.relevance)
                .map((kw) => [
                    kw.keyword,
                    kw.sentiment.charAt(0).toUpperCase() + kw.sentiment.slice(1),
                    (kw.relevance * 100).toFixed(1) + "%"
                ]);

            doc.autoTable({
                startY: yPos,
                head: [["Keyword", "Sentiment", "Relevance Score"]],
                body: keywordRows,
                theme: "grid",
                styles: { fontSize: 10, cellPadding: 4 },
                headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold", fontSize: 11 },
                bodyStyles: { alternateRowStyles: { fillColor: [245, 245, 245] } },
                margin: { left: margin, right: margin },
                columnStyles: {
                    0: { cellWidth: pageWidth - 2 * margin - 100 },
                    1: { cellWidth: 50, halign: "center" },
                    2: { cellWidth: 50, halign: "right" }
                }
            });

            yPos = doc.lastAutoTable.finalY + 12;

            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }

            console.log("Waiting for charts to fully render...");
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log("Capturing chart images...");
            const barChartImage = getChartImage("emotionBarChart");
            const pieChartImage = getChartImage("emotionPieChart");
            const radarChartImage = getChartImage("emotionRadarChart");

            console.log("Chart capture summary:", {
                bar: barChartImage ? `✓ (${(barChartImage.length / 1024).toFixed(1)}KB)` : "✗",
                pie: pieChartImage ? `✓ (${(pieChartImage.length / 1024).toFixed(1)}KB)` : "✗",
                radar: radarChartImage ? `✓ (${(radarChartImage.length / 1024).toFixed(1)}KB)` : "✗"
            });

            if (barChartImage || pieChartImage || radarChartImage) {
                doc.addPage();
                yPos = margin;

                doc.setFontSize(16);
                doc.setFont(undefined, "bold");
                doc.setTextColor(30, 64, 175);
                doc.text("4. Visualizations", margin, yPos);
                yPos += 8;

                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 12;

                let chartYPos = yPos;

                if (barChartImage) {
                    try {
                        doc.setFontSize(11);
                        doc.setFont(undefined, "bold");
                        doc.setTextColor(0, 0, 0);
                        doc.text("Emotion Intensity Chart", margin + 2, chartYPos);
                        const chartWidth = pageWidth - 2 * margin;
                        doc.addImage(barChartImage, "JPEG", margin, chartYPos + 5, chartWidth, 65);
                        chartYPos += 75;
                    } catch (err) {
                        console.warn("Failed to add bar chart:", err);
                    }
                }

                chartYPos += 10;

                const sideChartWidth = (pageWidth - 3 * margin) / 2;
                const sideChartHeight = 70;
                let sideChartX = margin;

                if (pieChartImage) {
                    try {
                        doc.setFontSize(11);
                        doc.setFont(undefined, "bold");
                        doc.setTextColor(0, 0, 0);
                        doc.text("Emotion Distribution", sideChartX + 2, chartYPos);
                        doc.addImage(pieChartImage, "JPEG", sideChartX, chartYPos + 5, sideChartWidth, sideChartHeight);
                        sideChartX += sideChartWidth + margin;
                    } catch (err) {
                        console.warn("Failed to add pie chart:", err);
                        sideChartX += sideChartWidth + margin;
                    }
                }

                if (radarChartImage) {
                    try {
                        doc.setFontSize(11);
                        doc.setFont(undefined, "bold");
                        doc.setTextColor(0, 0, 0);
                        doc.text("Emotion Profile Radar", sideChartX + 2, chartYPos);
                        doc.addImage(radarChartImage, "JPEG", sideChartX, chartYPos + 5, sideChartWidth, sideChartHeight);
                    } catch (err) {
                        console.warn("Failed to add radar chart:", err);
                    }
                }
            }

            const totalPages = doc.internal.pages.length;
            for (let i = 1; i < totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Page ${i} of ${totalPages - 1}`,
                    pageWidth / 2,
                    pageHeight - 8,
                    { align: "center" }
                );
            }

            doc.save("sentiment_report.pdf");
            console.log("✅ PDF generated successfully");
        } catch (error) {
            console.error("❌ Error generating PDF:", error);
            displayError(
                `Error generating PDF: ${error.message}`,
                DOMElements.errorMessageDiv,
                DOMElements.errorTextSpan
            );
        }
    }

    function downloadJSON(data) {
        const dataStr = JSON.stringify(data, null, 4);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sentiment_analysis.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadCSV(data) {
        let csv = "Metric,Value\n";
        csv += `Overall Sentiment,${data.overall_sentiment.charAt(0).toUpperCase() + data.overall_sentiment.slice(1)}\n`;
        csv += `Sentiment Score,${data.sentiment_score.toFixed(2)}\n`;
        csv += `Emotional Tone,${DOMElements.emotionalToneSpan.textContent}\n\n`;

        csv += "Emotion,Intensity\n";
        Object.entries(data.emotions).forEach(([emotion, score]) => {
            csv += `${emotion.charAt(0).toUpperCase() + emotion.slice(1)},${(score * 100).toFixed(2)}%\n`;
        });
        csv += "\n";

        csv += "Keyword,Sentiment,Relevance\n";
        data.keywords.forEach((kw) => {
            csv += `${kw.keyword},${kw.sentiment.charAt(0).toUpperCase() + kw.sentiment.slice(1)},${(kw.relevance * 100).toFixed(2)}%\n`;
        });

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sentiment_analysis.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // --- Model Evaluation Functions ---
    async function addToEvalData() {
        const text = DOMElements.evalTextInput.value.trim();
        const trueSentiment = DOMElements.trueSentimentSelect.value;

        if (!text || !trueSentiment) {
            displayError(
                "Please enter text and select a true sentiment.",
                DOMElements.evalErrorMessageDiv,
                DOMElements.evalErrorTextSpan
            );
            return;
        }

        showLoading(DOMElements.evalButtonText, DOMElements.evalLoadingIndicator);
        hideError(DOMElements.evalErrorMessageDiv);

        try {
            const predictedAnalysis = await getSentimentAnalysis(text);
            evaluationData.push({
                text: text,
                true: trueSentiment,
                predicted: predictedAnalysis.overall_sentiment
            });
            renderEvaluationDataList();
            DOMElements.evalTextInput.value = "";
            DOMElements.trueSentimentSelect.value = "";
            DOMElements.evaluationDataList.classList.remove("hidden");
            DOMElements.calculateMetricsButton.classList.remove("hidden");
        } catch (error) {
            displayError(
                `Error analyzing text for evaluation: ${error.message}`,
                DOMElements.evalErrorMessageDiv,
                DOMElements.evalErrorTextSpan
            );
        } finally {
            hideLoading(DOMElements.evalButtonText, DOMElements.evalLoadingIndicator);
        }
    }

    function renderEvaluationDataList() {
        DOMElements.evalList.innerHTML = "";
        evaluationData.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = "batch-result-item text-sm";
            const predictionClass = item.predicted === item.true ? "text-green-600" : "text-red-600";
            li.innerHTML = `
                <strong>Text:</strong> "${item.text.length > 70 ? item.text.substring(0, 67) + "..." : item.text}"<br>
                <strong>True:</strong> ${item.true.charAt(0).toUpperCase() + item.true.slice(1)},
                <strong>Predicted:</strong> <span class="${predictionClass}">${item.predicted.charAt(0).toUpperCase() + item.predicted.slice(1)}</span>
            `;
            DOMElements.evalList.appendChild(li);
        });
    }

    function calculateAndDisplayMetrics() {
        if (evaluationData.length === 0) {
            displayError(
                "No evaluation data collected.",
                DOMElements.evalErrorMessageDiv,
                DOMElements.evalErrorTextSpan
            );
            return;
        }

        DOMElements.metricsResultsSection.classList.remove("hidden");
        hideError(DOMElements.evalErrorMessageDiv);

        const labels = ["positive", "negative", "neutral"];
        const confusionMatrix = {
            positive: { positive: 0, negative: 0, neutral: 0 },
            negative: { positive: 0, negative: 0, neutral: 0 },
            neutral: { positive: 0, negative: 0, neutral: 0 }
        };

        let correctPredictions = 0;

        evaluationData.forEach((item) => {
            if (confusionMatrix[item.predicted] && confusionMatrix[item.predicted][item.true] !== undefined) {
                confusionMatrix[item.predicted][item.true]++;
            }
            if (item.predicted === item.true) {
                correctPredictions++;
            }
        });

        document.getElementById("cm-pp").textContent = confusionMatrix.positive.positive;
        document.getElementById("cm-pn").textContent = confusionMatrix.positive.negative;
        document.getElementById("cm-p-neu").textContent = confusionMatrix.positive.neutral;
        document.getElementById("cm-np").textContent = confusionMatrix.negative.positive;
        document.getElementById("cm-nn").textContent = confusionMatrix.negative.negative;
        document.getElementById("cm-n-neu").textContent = confusionMatrix.negative.neutral;
        document.getElementById("cm-neu-p").textContent = confusionMatrix.neutral.positive;
        document.getElementById("cm-neu-n").textContent = confusionMatrix.neutral.negative;
        document.getElementById("cm-neu-neu").textContent = confusionMatrix.neutral.neutral;

        const accuracy = correctPredictions / evaluationData.length;
        DOMElements.accuracyScoreSpan.textContent = (accuracy * 100).toFixed(2) + "%";

        function calculateClassMetrics(className) {
            const tp = confusionMatrix[className][className];
            const fp = labels.reduce(
                (sum, trueLabel) => sum + (trueLabel !== className ? confusionMatrix[className][trueLabel] || 0 : 0),
                0
            );
            const fn = labels.reduce(
                (sum, predictedLabel) => sum + (predictedLabel !== className ? confusionMatrix[predictedLabel][className] || 0 : 0),
                0
            );

            const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
            const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
            const f1 = precision + recall === 0 ? 0 : (2 * (precision * recall)) / (precision + recall);

            return { precision, recall, f1 };
        }

        const posMetrics = calculateClassMetrics("positive");
        DOMElements.posPrecisionSpan.textContent = (posMetrics.precision * 100).toFixed(2) + "%";
        DOMElements.posRecallSpan.textContent = (posMetrics.recall * 100).toFixed(2) + "%";
        DOMElements.posF1Span.textContent = (posMetrics.f1 * 100).toFixed(2) + "%";

        const negMetrics = calculateClassMetrics("negative");
        DOMElements.negPrecisionSpan.textContent = (negMetrics.precision * 100).toFixed(2) + "%";
        DOMElements.negRecallSpan.textContent = (negMetrics.recall * 100).toFixed(2) + "%";
        DOMElements.negF1Span.textContent = (negMetrics.f1 * 100).toFixed(2) + "%";

        const neuMetrics = calculateClassMetrics("neutral");
        DOMElements.neuPrecisionSpan.textContent = (neuMetrics.precision * 100).toFixed(2) + "%";
        DOMElements.neuRecallSpan.textContent = (neuMetrics.recall * 100).toFixed(2) + "%";
        DOMElements.neuF1Span.textContent = (neuMetrics.f1 * 100).toFixed(2) + "%";
    }

    // --- Test API Connection ---
    async function testAPIConnection() {
        try {
            console.log("Testing backend server connection...");
            console.log("Connecting to:", HEALTH_CHECK_URL);
            
            const response = await fetch(HEALTH_CHECK_URL);

            if (response.ok) {
                const data = await response.json();
                console.log("✓ Backend server is running and healthy!");
                console.log("Response:", data);
            } else {
                throw new Error(`Health check failed with status ${response.status}`);
            }
        } catch (error) {
            console.error("✗ Backend connection test failed:", error);
            // Don't show error to user on initial load - they might be deploying
            console.log("⚠️ If you're deploying, this is normal until backend is live.");
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        DOMElements.analyzeButton.addEventListener("click", async () => {
            console.log("🔘 ANALYZE BUTTON CLICKED");

            const text = DOMElements.textInput.value.trim();
            console.log("📝 Text input value:", text);
            console.log("📝 Text length:", text.length);

            if (!text) {
                console.log("❌ No text entered");
                displayError(
                    "Please enter some text to analyze.",
                    DOMElements.errorMessageDiv,
                    DOMElements.errorTextSpan
                );
                return;
            }
            console.log("✓ Text validation passed");
            hideError(DOMElements.errorMessageDiv);
            DOMElements.resultsSection.classList.add("hidden");
            DOMElements.clearButton.classList.add("hidden");
            DOMElements.downloadButtonWrapper.classList.add("hidden");

            console.log("🔄 Showing loading spinner...");
            showLoading(DOMElements.buttonText, DOMElements.loadingIndicator);

            try {
                console.log("🔄 Calling getSentimentAnalysis with text:", text.substring(0, 50) + "...");
                const analysis = await getSentimentAnalysis(text);
                console.log("✅ Analysis received:", analysis);
                displaySentimentResults(analysis);
            } catch (error) {
                console.error("❌ CAUGHT ERROR:", error);
                console.error("Error message:", error.message);
                console.error("Error stack:", error.stack);
                displayError(error.message, DOMElements.errorMessageDiv, DOMElements.errorTextSpan);
            } finally {
                console.log("🔄 Hiding loading spinner...");
                hideLoading(DOMElements.buttonText, DOMElements.loadingIndicator);
            }
        });

        DOMElements.clearButton.addEventListener("click", resetUI);

        DOMElements.downloadReportButton.addEventListener("click", (e) => {
            e.stopPropagation();
            showDownloadOptions();
        });

        document.addEventListener("click", (e) => {
            if (!DOMElements.downloadButtonWrapper.contains(e.target)) {
                DOMElements.downloadOptions.classList.add("hidden");
            }
        });

        document.querySelectorAll(".download-option-btn").forEach((button) => {
            button.addEventListener("click", () => {
                DOMElements.downloadOptions.classList.add("hidden");
                if (!lastAnalysisResult) {
                    displayError(
                        "No analysis result to download.",
                        DOMElements.errorMessageDiv,
                        DOMElements.errorTextSpan
                    );
                    return;
                }
                const format = button.dataset.format;
                if (format === "pdf") {
                    generatePDFReport(lastAnalysisResult);
                } else if (format === "json") {
                    downloadJSON(lastAnalysisResult);
                } else if (format === "csv") {
                    downloadCSV(lastAnalysisResult);
                }
            });
        });

        DOMElements.analyzeFileButton.addEventListener("click", handleFileAnalysis);
        DOMElements.analyzeFileButton.addEventListener("click", analyzeBatch);
        DOMElements.addToEvalButton.addEventListener("click", addToEvalData);
        DOMElements.calculateMetricsButton.addEventListener("click", calculateAndDisplayMetrics);
    }

    // --- Initialization ---
    function init() {
        console.log("Initializing Sentiment Analyzer...");
        console.log("Backend URL:", BACKEND_URL);
        console.log("API Endpoint:", API_ENDPOINT);

        // Test backend connection (silent in production)
        testAPIConnection();

        hideLoading(DOMElements.buttonText, DOMElements.loadingIndicator);
        hideLoading(DOMElements.fileButtonText, DOMElements.fileLoadingIndicator);
        hideLoading(DOMElements.evalButtonText, DOMElements.evalLoadingIndicator);

        setupComparativeAnalysis();
        setupMainTabs();
        setupVizTabs();
        setupFileUpload();
        setupEventListeners();
        DOMElements.analyzeFileButton.disabled = true;
    }

    init();
});
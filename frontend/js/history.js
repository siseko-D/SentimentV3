
document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const historyList = document.getElementById("history-list");
    const emptyState = document.getElementById("empty-state");
    const clearHistoryBtn = document.getElementById("clear-history");
    const paginationContainer = document.getElementById("pagination");
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
    const pageNumbersContainer = document.getElementById("page-numbers");
    const historyDetailsModal = document.getElementById("history-details-modal");
    const modalContent = document.getElementById("modal-content");
    const modalCloseButton = document.getElementById("modal-close-button");
    const searchInput = document.getElementById("search-input");
    const sentimentFilter = document.getElementById("sentiment-filter");
    const typeFilter = document.getElementById("type-filter");
    const dateFromInput = document.getElementById("date-from");
    const dateToInput = document.getElementById("date-to");
    const exportCsvBtn = document.getElementById("export-csv");

    // Clear History Confirmation Modal elements
    const confirmClearModal = document.getElementById("confirm-clear-modal");
    const cancelClearBtn = document.getElementById("cancel-clear-btn");
    const confirmClearBtn = document.getElementById("confirm-clear-btn");

    // Configuration
    const ITEMS_PER_PAGE = 5;
    let currentPage = 1;
    let totalPages = 1;
    let allHistoryItems = []; // Stores all items from localStorage
    let filteredHistoryItems = []; // Stores items after applying filters

    /**
     * Loads history from localStorage and initializes the view.
     */
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem("sentimentAnalysisHistory")) || [];
        allHistoryItems = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by newest first
        applyFilters(); // Apply filters initially
    }

    /**
     * Applies current search and filter criteria to history items.
     */
    function applyFilters() {
        let tempItems = [...allHistoryItems]; // Work with a copy

        // Search Filter
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (searchTerm) {
            tempItems = tempItems.filter(
                (item) =>
                    (item.text && item.text.toLowerCase().includes(searchTerm)) ||
                    (item.title && item.title.toLowerCase().includes(searchTerm)) ||
                    (item.isBatch &&
                        item.items.some((subItem) => subItem.text.toLowerCase().includes(searchTerm)))
            );
        }

        // Sentiment Filter
        const selectedSentiment = sentimentFilter.value;
        if (selectedSentiment) {
            tempItems = tempItems.filter(
                (item) =>
                    item.overall_sentiment && item.overall_sentiment.toLowerCase() === selectedSentiment
            );
        }

        // Type Filter
        const selectedType = typeFilter.value;
        if (selectedType) {
            tempItems = tempItems.filter(
                (item) =>
                    (selectedType === "single" && !item.isBatch) ||
                    (selectedType === "batch" && item.isBatch)
            );
        }

        // Date Range Filter
        const dateFrom = dateFromInput.value ? new Date(dateFromInput.value).setHours(0, 0, 0, 0) : null;
        const dateTo = dateToInput.value ? new Date(dateToInput.value).setHours(23, 59, 59, 999) : null;

        if (dateFrom || dateTo) {
            tempItems = tempItems.filter((item) => {
                const itemDate = new Date(item.timestamp).getTime();
                const matchesFrom = dateFrom ? itemDate >= dateFrom : true;
                const matchesTo = dateTo ? itemDate <= dateTo : true;
                return matchesFrom && matchesTo;
            });
        }

        filteredHistoryItems = tempItems;
        currentPage = 1; // Reset to first page after applying filters
        updatePagination();
        renderHistoryItems();
    }

    /**
     * Renders history items for the current page based on filtered items.
     */
    function renderHistoryItems() {
        historyList.innerHTML = "";

        if (filteredHistoryItems.length === 0) {
            emptyState.classList.remove("hidden");
            clearHistoryBtn.classList.add("hidden");
            exportCsvBtn.classList.add("hidden");
            paginationContainer.classList.add("hidden");
            return;
        }

        emptyState.classList.add("hidden");
        clearHistoryBtn.classList.remove("hidden");
        exportCsvBtn.classList.remove("hidden");
        paginationContainer.classList.remove("hidden");

        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredHistoryItems.length);
        const itemsToDisplay = filteredHistoryItems.slice(startIndex, endIndex);

        itemsToDisplay.forEach((item, index) => {
            const historyItem = document.createElement("div");
            historyItem.className = "history-item";
            historyItem.dataset.id = item.id;

            // Force reflow for animation
            void historyItem.offsetWidth;
            setTimeout(() => {
                historyItem.classList.add("show");
            }, index * 50); // Stagger animation

            let sentimentBadge = "";
            if (item.overall_sentiment) {
                const sentimentClass = item.overall_sentiment.toLowerCase();
                sentimentBadge = `<span class="sentiment-badge ${sentimentClass}">${item.overall_sentiment.charAt(0).toUpperCase() + item.overall_sentiment.slice(1)}</span>`;
            } else if (item.isBatch) {
                // For batch, show "Batch" or primary sentiment if available
                sentimentBadge = `<span class="sentiment-badge neutral">Batch Analysis</span>`;
            }

            let batchInfo = "";
            if (item.isBatch) {
                batchInfo = `
                            <div class="flex gap-4 text-sm mb-3">
                                <div class="flex items-center">
                                    <span class="w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                                    <span>${item.positiveCount} Positive</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                                    <span>${item.negativeCount} Negative</span>
                                </div>
                                <div class="flex items-center">
                                    <span class="w-3 h-3 rounded-full bg-gray-400 mr-1"></span>
                                    <span>${item.neutralCount} Neutral</span>
                                </div>
                            </div>
                            <div class="flex justify-end">
                                <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium text-sm" data-id="${item.id}" aria-label="View full report for batch analysis">
                                    View Full Report
                                </button>
                            </div>
                        `;
            } else {
                batchInfo = `
                            <p class="text-preview text-gray-600 mb-3">
                                "${item.text.length > 100 ? item.text.substring(0, 97) + "..." : item.text}"
                            </p>
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-500">Score: ${item.sentiment_score ? item.sentiment_score.toFixed(2) : "N/A"}</span>
                                <button class="view-details-btn text-blue-600 hover:text-blue-800 font-medium" data-id="${item.id}" aria-label="View details for single analysis">
                                    View Details
                                </button>
                            </div>
                        `;
            }

            historyItem.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <span class="text-sm text-gray-500">${new Date(item.timestamp).toLocaleString()}</span>
                                <h3 class="text-lg font-semibold text-gray-800">${item.title || (item.isBatch ? "Batch Analysis" : "Single text analysis")}</h3>
                            </div>
                            ${sentimentBadge}
                        </div>
                        ${batchInfo}
                    `;

            historyList.appendChild(historyItem);
        });

        // Add event listeners to view details buttons
        document.querySelectorAll(".view-details-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                showHistoryDetails(id);
            });
        });
    }

    /**
     * Updates pagination controls based on filtered history items.
     */
    function updatePagination() {
        totalPages = Math.ceil(filteredHistoryItems.length / ITEMS_PER_PAGE);
        pageNumbersContainer.innerHTML = "";

        if (totalPages <= 1) {
            paginationContainer.classList.add("hidden");
            return;
        }

        paginationContainer.classList.remove("hidden");

        // Previous button
        prevPageBtn.disabled = currentPage === 1;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement("button");
            pageBtn.className = `pagination-button ${i === currentPage ? "active" : ""}`;
            pageBtn.textContent = i;
            pageBtn.setAttribute("aria-label", `Go to page ${i}`);
            pageBtn.addEventListener("click", () => {
                currentPage = i;
                renderHistoryItems();
                updatePagination();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }

        // Next button
        nextPageBtn.disabled = currentPage === totalPages;
    }

    /**
     * Displays the detailed analysis in a modal.
     * @param {string} id - The ID of the history item to display.
     */
    function showHistoryDetails(id) {
        const item = allHistoryItems.find((item) => item.id === id); // Find from all history, not just filtered
        if (!item) return;

        let detailsContent = "";

        if (item.isBatch) {
            detailsContent = `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Batch Analysis Summary</h3>
                            <p class="text-gray-700 mb-2"><strong>Date:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                            <p class="text-gray-700 mb-4"><strong>Total Items:</strong> ${item.items.length}</p>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div class="bg-green-50 p-3 rounded-lg">
                                    <h4 class="font-medium text-green-800 mb-1">Positive</h4>
                                    <p class="text-2xl font-bold text-green-600">${item.positiveCount}</p>
                                    <p class="text-sm text-green-700">${((item.positiveCount / item.items.length) * 100).toFixed(1)}%</p>
                                </div>
                                <div class="bg-red-50 p-3 rounded-lg">
                                    <h4 class="font-medium text-red-800 mb-1">Negative</h4>
                                    <p class="text-2xl font-bold text-red-600">${item.negativeCount}</p>
                                    <p class="text-sm text-red-700">${((item.negativeCount / item.items.length) * 100).toFixed(1)}%</p>
                                </div>
                                <div class="bg-gray-50 p-3 rounded-lg">
                                    <h4 class="font-medium text-gray-800 mb-1">Neutral</h4>
                                    <p class="text-2xl font-bold text-gray-600">${item.neutralCount}</p>
                                    <p class="text-sm text-gray-700">${((item.neutralCount / item.items.length) * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Sample Items (First 10)</h3>
                            <div class="space-y-3 max-h-96 overflow-y-auto border border-gray-200 p-3 rounded-lg">
                                ${item.items
                    .slice(0, 10)
                    .map(
                        (subItem) => `
                                    <div class="p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
                                        <div class="flex justify-between items-center mb-1">
                                            <span class="text-sm font-medium ${subItem.sentiment === "positive"
                                ? "text-green-600"
                                : subItem.sentiment === "negative"
                                    ? "text-red-600"
                                    : "text-gray-600"
                            }">${subItem.sentiment.charAt(0).toUpperCase() + subItem.sentiment.slice(1)}</span>
                                            <span class="text-sm text-gray-500">Score: ${subItem.score.toFixed(2)}</span>
                                        </div>
                                        <p class="text-gray-700 text-sm">"${subItem.text.length > 150 ? subItem.text.substring(0, 147) + "..." : subItem.text}"</p>
                                    </div>
                                `
                    )
                    .join("")}
                            </div>
                            ${item.items.length > 10 ? '<p class="text-center text-gray-500 text-sm mt-3">... and more. Export to CSV for full list.</p>' : ""}
                        </div>
                    `;
        } else {
            detailsContent = `
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Text Analysis</h3>
                            <p class="text-gray-700 mb-1"><strong>Date:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
                            <p class="text-gray-700 mb-4"><strong>Title:</strong> ${item.title || "Single text analysis"}</p>
                        </div>
                        
                        <div class="mb-6 p-4 rounded-lg ${item.overall_sentiment === "positive"
                    ? "bg-green-50 border-l-4 border-green-500"
                    : item.overall_sentiment === "negative"
                        ? "bg-red-50 border-l-4 border-red-500"
                        : "bg-gray-50 border-l-4 border-gray-500"
                }">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Sentiment Analysis</h3>
                            <p class="text-gray-700 mb-1"><strong>Overall Sentiment:</strong> 
                                <span class="font-medium ${item.overall_sentiment === "positive"
                    ? "text-green-600"
                    : item.overall_sentiment === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                }">
                                    ${item.overall_sentiment.charAt(0).toUpperCase() + item.overall_sentiment.slice(1)}
                                </span>
                            </p>
                            <p class="text-gray-700 mb-1"><strong>Sentiment Score:</strong> ${item.sentiment_score ? item.sentiment_score.toFixed(2) : "N/A"}</p>
                            <p class="text-gray-700 mb-1"><strong>Emotional Tone:</strong> ${item.emotions && Object.keys(item.emotions).length > 0
                    ? Object.entries(item.emotions)
                        .sort(([, a], [, b]) => b - a)[0][0]
                        .charAt(0)
                        .toUpperCase() +
                    Object.entries(item.emotions)
                        .sort(([, a], [, b]) => b - a)[0][0]
                        .slice(1)
                    : "N/A"
                }</p>
                        </div>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Original Text</h3>
                            <div class="p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                                <p class="text-gray-700 whitespace-pre-wrap">${item.text}</p>
                            </div>
                        </div>
                        
                        ${item.keywords && item.keywords.length > 0
                    ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Sentiment-Driving Keywords</h3>
                            <div class="flex flex-wrap gap-2">
                                ${item.keywords
                        .map(
                            (kw) => `
                                    <span class="inline-block px-2 py-1 rounded-full text-xs font-medium 
                                        ${kw.sentiment === "positive"
                                    ? "bg-green-100 text-green-800"
                                    : kw.sentiment === "negative"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                }">
                                        ${kw.keyword} (${(kw.relevance * 100).toFixed(0)}%)
                                    </span>
                                `
                        )
                        .join("")}
                            </div>
                        </div>
                        `
                    : ""
                }
                        
                        ${item.emotions && Object.keys(item.emotions).length > 0
                    ? `
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">Emotion Analysis</h3>
                            <div class="flex flex-wrap gap-2">
                                ${Object.entries(item.emotions)
                        .sort(([, a], [, b]) => b - a)
                        .map(
                            ([emotion, score]) => `
                                    <span class="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        ${emotion.charAt(0).toUpperCase() + emotion.slice(1)} (${(score * 100).toFixed(0)}%)
                                    </span>
                                `
                        )
                        .join("")}
                            </div>
                        </div>
                        `
                    : ""
                }
                    `;
        }

        modalContent.innerHTML = detailsContent;
        historyDetailsModal.classList.add("active");
    }

    /**
     * Clears all history from localStorage after confirmation.
     */
    function clearHistory() {
        localStorage.removeItem("sentimentAnalysisHistory");
        allHistoryItems = [];
        applyFilters(); // Re-apply filters to show empty state
        hideClearConfirmModal();
    }

    /**
     * Shows the clear history confirmation modal.
     */
    function showClearConfirmModal() {
        confirmClearModal.classList.add("active");
    }

    /**
     * Hides the clear history confirmation modal.
     */
    function hideClearConfirmModal() {
        confirmClearModal.classList.remove("active");
    }

    /**
     * Exports the currently filtered history items to a CSV file.
     */
    function exportToCsv() {
        if (filteredHistoryItems.length === 0) {
            alert("No data to export.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = [
            "ID",
            "Timestamp",
            "Type",
            "Title",
            "Overall Sentiment",
            "Sentiment Score",
            "Positive Count",
            "Negative Count",
            "Neutral Count",
            "Original Text",
            "Keywords",
            "Emotions"
        ];
        csvContent += headers.join(",") + "\n";

        filteredHistoryItems.forEach((item) => {
            const row = [];
            row.push(`"${item.id}"`);
            row.push(`"${new Date(item.timestamp).toLocaleString()}"`);
            row.push(`"${item.isBatch ? "Batch" : "Single"}"`);
            row.push(
                `"${item.title ? item.title.replace(/"/g, '""') : item.isBatch ? "Batch Analysis" : "Single Text Analysis"}"`
            );
            row.push(`"${item.overall_sentiment ? item.overall_sentiment.replace(/"/g, '""') : ""}"`);
            row.push(`"${item.sentiment_score ? item.sentiment_score.toFixed(2) : ""}"`);
            row.push(`"${item.positiveCount || ""}"`);
            row.push(`"${item.negativeCount || ""}"`);
            row.push(`"${item.neutralCount || ""}"`);

            // Handle original text - escape quotes and newlines
            const originalText = item.text
                ? item.text.replace(/"/g, '""').replace(/\n/g, "\\n").replace(/\r/g, "")
                : "";
            row.push(`"${originalText}"`);

            // Keywords
            const keywords =
                item.keywords && item.keywords.length > 0
                    ? item.keywords
                        .map((kw) => `${kw.keyword} (${(kw.relevance * 100).toFixed(0)}%)`)
                        .join("; ")
                    : "";
            row.push(`"${keywords.replace(/"/g, '""')}"`);

            // Emotions
            const emotions =
                item.emotions && Object.keys(item.emotions).length > 0
                    ? Object.entries(item.emotions)
                        .map(([emo, score]) => `${emo} (${(score * 100).toFixed(0)}%)`)
                        .join("; ")
                    : "";
            row.push(`"${emotions.replace(/"/g, '""')}"`);

            csvContent += row.join(",") + "\n";

            // If it's a batch item, append sub-items
            if (item.isBatch && item.items) {
                item.items.forEach((subItem) => {
                    const subRow = [];
                    subRow.push(""); // ID (empty for sub-item)
                    subRow.push(""); // Timestamp
                    subRow.push("Batch Sub-item"); // Type
                    subRow.push(""); // Title
                    subRow.push(`"${subItem.sentiment ? subItem.sentiment.replace(/"/g, '""') : ""}"`);
                    subRow.push(`"${subItem.score ? subItem.score.toFixed(2) : ""}"`);
                    subRow.push("", "", ""); // Counts (empty for sub-item)

                    const subItemText = subItem.text
                        ? subItem.text.replace(/"/g, '""').replace(/\n/g, "\\n").replace(/\r/g, "")
                        : "";
                    subRow.push(`"${subItemText}"`);
                    subRow.push("", ""); // Keywords, Emotions (empty for sub-item, if not captured individually)
                    csvContent += subRow.join(",") + "\n";
                });
            }
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `sentiment_analysis_history_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link); // Required for Firefox
        link.click();
        document.body.removeChild(link);
    }

    // Event Listeners for Filters
    searchInput.addEventListener("input", applyFilters);
    sentimentFilter.addEventListener("change", applyFilters);
    typeFilter.addEventListener("change", applyFilters);
    dateFromInput.addEventListener("change", applyFilters);
    dateToInput.addEventListener("change", applyFilters);

    // Event listeners for Clear History
    clearHistoryBtn.addEventListener("click", showClearConfirmModal);
    cancelClearBtn.addEventListener("click", hideClearConfirmModal);
    confirmClearBtn.addEventListener("click", clearHistory);
    confirmClearModal.addEventListener("click", (e) => {
        if (e.target === confirmClearModal) {
            hideClearConfirmModal();
        }
    });

    // Event listeners for Pagination
    prevPageBtn.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderHistoryItems();
            updatePagination();
            window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top on page change
        }
    });

    nextPageBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderHistoryItems();
            updatePagination();
            window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top on page change
        }
    });

    // Event listeners for Details Modal
    modalCloseButton.addEventListener("click", () => {
        historyDetailsModal.classList.remove("active");
    });

    historyDetailsModal.addEventListener("click", (e) => {
        if (e.target === historyDetailsModal) {
            historyDetailsModal.classList.remove("active");
        }
    });

    // Event listener for Export CSV
    exportCsvBtn.addEventListener("click", exportToCsv);

    // Initialize
    loadHistory();
});

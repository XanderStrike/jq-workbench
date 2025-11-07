const jsonInput = document.getElementById('jsonInput');
const queryInput = document.getElementById('queryInput');
const resultOutput = document.getElementById('resultOutput');
const aiPromptInput = document.getElementById('aiPromptInput');
const generateQueryBtn = document.getElementById('generateQueryBtn');
const formatBtn = document.getElementById('formatBtn');

// Set initial example data
jsonInput.value = JSON.stringify({
    "name": "John Doe",
    "age": 30,
    "city": "New York",
    "hobbies": ["reading", "coding", "hiking"],
    "address": {
        "street": "123 Main St",
        "zip": "10001"
    }
}, null, 2);

let jqReady = false;
let jqModule = null;

// Initialize jq
function initializeJQ() {
    if (typeof jq !== 'undefined') {
        jq.then(module => {
            jqReady = true;
            jqModule = module;
            executeJQ();
        }).catch(error => {
            resultOutput.textContent = `Error: ${error.message}`;
            resultOutput.className = 'error';
        });
    } else {
        resultOutput.textContent = 'Error: jq library not loaded';
        resultOutput.className = 'error';
    }
}

function executeJQ() {
    if (!jqReady) {
        resultOutput.textContent = 'Loading jq...';
        return;
    }

    const jsonText = jsonInput.value;
    const query = queryInput.value || '.';

    try {
        // Parse JSON to validate it
        const jsonData = JSON.parse(jsonText);

        // Execute jq query using the loaded module
        const result = jqModule.json(jsonData, query);

        // Format and display result
        if (typeof result === 'object') {
            resultOutput.textContent = JSON.stringify(result, null, 2);
        } else {
            resultOutput.textContent = result;
        }
        resultOutput.className = 'success';
    } catch (error) {
        resultOutput.textContent = `Error: ${error.message}`;
        resultOutput.className = 'error';
    }
}

// Real-time execution
let timeout;
function executeWithDelay() {
    clearTimeout(timeout);
    timeout = setTimeout(executeJQ, 300); // 300ms delay
}

// Event listeners for real-time updates
jsonInput.addEventListener('input', executeWithDelay);
queryInput.addEventListener('input', executeWithDelay);

// Toggle cheatsheet visibility
function toggleCheatsheet() {
    const content = document.getElementById('cheatsheet-content');
    const toggle = document.getElementById('cheatsheet-toggle');

    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼';
    }
}

// AI Query Generation
async function generateQuery() {
    const userPrompt = aiPromptInput.value.trim();

    if (!userPrompt) {
        resultOutput.textContent = 'Error: Please enter a description for what you want to extract';
        resultOutput.className = 'error';
        return;
    }

    // Disable button and show loading state
    generateQueryBtn.disabled = true;
    generateQueryBtn.textContent = 'Generating...';

    try {
        const jsonText = jsonInput.value;

        // Validate JSON before sending to AI
        let jsonData;
        try {
            jsonData = JSON.parse(jsonText);
        } catch (e) {
            resultOutput.textContent = 'Error: Please enter valid JSON before generating a query';
            resultOutput.className = 'error';
            return;
        }

        // Attempt to generate and validate query with retry logic
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;
        let lastQuery = null;

        while (attempts < maxAttempts) {
            attempts++;

            // Construct prompt for the AI to generate only the jq query
            let aiContext;
            if (attempts === 1) {
                // First attempt - normal prompt
                aiContext = `Given this JSON data:
${JSON.stringify(jsonData, null, 2)}

User request: ${userPrompt}

Generate a jq query that accomplishes the user's request. Respond with ONLY the jq query, nothing else. Do not include explanations, markdown formatting, quotes, or code blocks. Do not include the jq command, just the raw jq query string.`;
            } else {
                // Retry with error feedback
                generateQueryBtn.textContent = `Fixing... (${attempts}/${maxAttempts})`;
                aiContext = `Given this JSON data:
${JSON.stringify(jsonData, null, 2)}

User request: ${userPrompt}

Your previous jq query was:
${lastQuery}

It failed with this error:
${lastError}

Generate a corrected jq query that accomplishes the user's request and fixes the error. Respond with ONLY the jq query, nothing else. Do not include explanations, markdown formatting, quotes, or code blocks. Do not include the jq command, just the raw jq query string.`;
            }

            // Call the AI using the quick module
            const generatedQuery = await quick.ai.ask(aiContext);

            // Clean up the response - remove any potential markdown or extra whitespace
            const cleanedQuery = generatedQuery.trim().replace(/^```.*\n?|```$/g, '').trim();

            // Update the query input with the generated query
            queryInput.value = cleanedQuery;

            // Test the query with jq
            try {
                const result = jqModule.json(jsonData, cleanedQuery);

                // If successful, display the result and exit
                if (typeof result === 'object') {
                    resultOutput.textContent = JSON.stringify(result, null, 2);
                } else {
                    resultOutput.textContent = result;
                }
                resultOutput.className = 'success';

                // Clear the AI prompt input on success
                // aiPromptInput.value = '';
                break; // Exit the retry loop
            } catch (error) {
                // Store the error and query for the next attempt
                lastError = error.message;
                lastQuery = cleanedQuery;

                if (attempts >= maxAttempts) {
                    // Max attempts reached, show final error
                    resultOutput.textContent = `Error: Failed to generate valid query after ${maxAttempts} attempts.\nLast error: ${error.message}`;
                    resultOutput.className = 'error';
                }
                // Otherwise, continue to next retry
            }
        }
    } catch (error) {
        resultOutput.textContent = `Error generating query: ${error.message}`;
        resultOutput.className = 'error';
    } finally {
        // Re-enable button
        generateQueryBtn.disabled = false;
        generateQueryBtn.textContent = 'Generate';
    }
}

// Format JSON input
function formatJSON() {
    if (!jqReady) {
        resultOutput.textContent = 'Error: jq not loaded yet';
        resultOutput.className = 'error';
        return;
    }

    const jsonText = jsonInput.value.trim();

    if (!jsonText) {
        return;
    }

    try {
        // Parse JSON to validate it
        const jsonData = JSON.parse(jsonText);

        // Use jq to format with identity operator
        const formatted = jqModule.json(jsonData, '.');

        // Update the input with formatted JSON
        jsonInput.value = JSON.stringify(formatted, null, 2);
    } catch (error) {
        resultOutput.textContent = `Format Error: ${error.message}`;
        resultOutput.className = 'error';
    }
}

// Event listeners for AI query generation
generateQueryBtn.addEventListener('click', generateQuery);
aiPromptInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateQuery();
    }
});

// Event listener for format button
formatBtn.addEventListener('click', formatJSON);

// Initialize jq when the page loads
window.addEventListener('load', initializeJQ);

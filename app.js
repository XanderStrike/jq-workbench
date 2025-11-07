const jsonInput = document.getElementById('jsonInput');
const queryInput = document.getElementById('queryInput');
const resultOutput = document.getElementById('resultOutput');

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

// Initialize jq when the page loads
window.addEventListener('load', initializeJQ);

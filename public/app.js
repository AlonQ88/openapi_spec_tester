let currentSpec = null;
let currentTestRequests = [];

// Setup file upload
document.getElementById('specFile').addEventListener('change', handleFileSelect);

const uploadArea = document.getElementById('uploadArea');
uploadArea.addEventListener('click', () => document.getElementById('specFile').click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

async function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const file = files[0];
    const statusDiv = document.getElementById('uploadStatus');
    
    // Show loading status
    statusDiv.innerHTML = '<div class="status-message loading"><div class="spinner"></div> Parsing specification...</div>';
    
    try {
        const content = await file.text();
        let spec;
        
        try {
            spec = JSON.parse(content);
        } catch {
            throw new Error('Invalid JSON file format');
        }
        
        // Validate spec
        if (!spec.openapi && !spec.swagger) {
            throw new Error('Not a valid OpenAPI/Swagger specification');
        }
        
        currentSpec = spec;
        
        // Parse and generate tests
        await parseAndGenerateTests(spec);
        
        statusDiv.innerHTML = '<div class="status-message success">✓ Specification loaded successfully!</div>';
    } catch (error) {
        statusDiv.innerHTML = `<div class="status-message error">✗ Error: ${error.message}</div>`;
        currentSpec = null;
    }
}

async function parseAndGenerateTests(spec) {
    try {
        // Send to backend to parse and generate tests
        const response = await fetch('/api/parse-spec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(spec),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to parse specification');
        }

        const data = await response.json();
        
        // Display spec details
        displaySpecDetails(data.spec);
        
        // Display generated tests
        currentTestRequests = data.testRequests;
        displayGeneratedTests(data.testRequests);
        
        // Show step 2 and 3
        document.getElementById('step2').style.display = 'block';
        document.getElementById('step3').style.display = 'block';
        document.getElementById('step4').style.display = 'none';
        
    } catch (error) {
        alert(`Error parsing specification: ${error.message}`);
    }
}

function displaySpecDetails(spec) {
    const detailsDiv = document.getElementById('specDetails');
    detailsDiv.innerHTML = `
        <div class="detail-card">
            <h3>Title</h3>
            <p>${spec.title || 'Unknown'}</p>
        </div>
        <div class="detail-card">
            <h3>Version</h3>
            <p>${spec.version || 'Unknown'}</p>
        </div>
        <div class="detail-card">
            <h3>Base URL</h3>
            <p>${spec.baseUrl || 'Not specified'}</p>
        </div>
        <div class="detail-card">
            <h3>Endpoints</h3>
            <p>${Object.keys(spec.paths).length}</p>
        </div>
    `;
}

function displayGeneratedTests(tests) {
    const testsList = document.getElementById('testsList');
    document.getElementById('testCount').textContent = tests.length;
    
    if (tests.length === 0) {
        testsList.innerHTML = '<p>No tests generated from specification.</p>';
        return;
    }
    
    testsList.innerHTML = tests.map((test, index) => `
        <div class="test-item">
            <div>
                <span class="test-method ${test.method}">${test.method}</span>
                <span class="test-path">${test.path}</span>
            </div>
        </div>
    `).join('');
}

async function runTests() {
    if (currentTestRequests.length === 0) {
        alert('No tests to run');
        return;
    }
    
    const runBtn = document.getElementById('runTestsBtn');
    runBtn.disabled = true;
    runBtn.innerHTML = '<span class="spinner"></span> Running tests...';
    
    const statusDiv = document.getElementById('resultsStatus');
    statusDiv.innerHTML = '<div class="status-message loading"><div class="spinner"></div> Executing tests...</div>';
    
    try {
        const response = await fetch('/api/run-tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                testRequests: currentTestRequests,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to run tests');
        }

        const data = await response.json();
        
        // Display results
        displayTestResults(data.results, data.summary);
        
        // Show step 4
        document.getElementById('step4').style.display = 'block';
        
    } catch (error) {
        statusDiv.innerHTML = `<div class="status-message error">✗ Error: ${error.message}</div>`;
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = 'Run Tests';
    }
}

function displayTestResults(results, summary) {
    const statusDiv = document.getElementById('resultsStatus');
    const successPercentage = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
    
    statusDiv.innerHTML = `
        <div style="margin-bottom: 15px;">
            <span class="summary-item">Total: <strong>${summary.total}</strong></span>
            <span class="summary-item">Passed: <strong style="color: var(--success-color);">${summary.passed}</strong></span>
            <span class="summary-item">Failed: <strong style="color: var(--danger-color);">${summary.failed}</strong></span>
            <span class="summary-item">Success Rate: <strong>${successPercentage}%</strong></span>
        </div>
        <div style="background: var(--bg-color); padding: 10px; border-radius: 6px; overflow: hidden;">
            <div style="height: 20px; background: var(--danger-color); width: ${100 - successPercentage}%; display: inline-block;"></div>
            <div style="height: 20px; background: var(--success-color); width: ${successPercentage}%; display: inline-block;"></div>
        </div>
    `;
    
    const resultsList = document.getElementById('resultsList');
    resultsList.innerHTML = results.map((result, index) => `
        <div class="result-item ${result.success ? 'success' : 'failure'}">
            <div class="result-header">
                <div>
                    <span class="result-method ${result.method}">${result.method}</span>
                    <span>${result.path}</span>
                </div>
                <span class="result-status ${result.success ? 'success' : 'failure'}">
                    ${result.success ? '✓ Success' : '✗ Failed'}
                </span>
            </div>
            <div class="result-path">${result.url}</div>
            <div class="result-details">
                <div class="result-detail">
                    <span class="result-detail-label">Status Code:</span>
                    <span class="result-detail-value">${result.status || 'N/A'}</span>
                </div>
                <div class="result-detail">
                    <span class="result-detail-label">Response Time:</span>
                    <span class="result-detail-value">${result.responseTime}ms</span>
                </div>
                ${result.error ? `
                <div class="result-detail" style="grid-column: 1 / -1;">
                    <span class="result-detail-label">Error:</span>
                    <span class="result-detail-value">${result.error}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Check server health on load
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/api/health');
        if (!response.ok) {
            console.error('Server health check failed');
        }
    } catch (error) {
        console.error('Cannot connect to server:', error);
    }
});

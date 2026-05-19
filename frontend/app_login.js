// Variable to store the resolved backend URL destination
let targetApiUrl = "";

/**
 * Validates environmental layers to secure the correct API endpoint
 */
function resolveApi() {
    if (window.env && window.env.API_URL) return window.env.API_URL;
    if (typeof API_BASE_URL !== 'undefined') return API_BASE_URL;
    return null;
}

// Event listener to capture form submission and push security telemetry
document.getElementById('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'none';
    
    // Resolve the API URL dynamic endpoint if not cached locally
    if (!targetApiUrl) targetApiUrl = resolveApi();
    
    if (!targetApiUrl) {
        feedback.className = "alert alert-danger";
        feedback.innerText = "Error: API URL configuration endpoint missing.";
        feedback.style.display = 'block';
        return;
    }

    // Generate a random unique event ID mimicry (SIEM payload structure)
    const eventId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const username = document.getElementById('username').value.trim();
    const status = document.getElementById('status').value;
    const timestamp = Math.floor(Date.now() / 1000);

    // Build automated forensic log strings details based on status
    let details = "User verification completed via web portal.";
    if (status === 'FAILED') {
        details = "Authentication failure: Invalid credential token payload submitted for password field.";
    }

    // Wrap the payload structure exactly how our Lambda handler expects it
    const payload = { eventId, username, timestamp, status, details };

    try {
        const response = await fetch(`${targetApiUrl}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            feedback.className = "alert alert-success";
            feedback.innerText = `Event dispatched! Status: ${status}. Dashboard notified.`;
            
            // Reset input values for subsequent simulation testing
            document.getElementById('username').value = "";
            document.getElementById('password').value = "";
        } else {
            throw new Error(`API Gateway returned HTTP Status ${response.status}`);
        }
    } catch (err) {
        feedback.className = "alert alert-danger";
        feedback.innerText = `Ingestion Failed: ${err.message}`;
    }
    
    feedback.style.display = 'block';
});
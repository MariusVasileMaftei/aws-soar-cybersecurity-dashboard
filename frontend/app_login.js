let baseApiUrl = "";

function resolveApi() {
    if (window.env && window.env.API_URL) return window.env.API_URL;
    if (typeof API_BASE_URL !== 'undefined') return API_BASE_URL;
    return null;
}

document.getElementById('authForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'none';
    
    if (!baseApiUrl) baseApiUrl = resolveApi();
    
    if (!baseApiUrl) {
        feedback.className = "alert alert-danger";
        feedback.innerText = "Error: API URL endpoint configuration missing.";
        feedback.style.display = 'block';
        return;
    }

    // Ensure the endpoint hits the precise /login route mapped in API Gateway
    let targetUrl = baseApiUrl;
    if (!targetUrl.endsWith('/login')) {
        targetUrl = targetUrl.endsWith('/') ? `${targetUrl}login` : `${targetUrl}/login`;
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const payload = { username, password };

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        feedback.style.display = 'block';
        
        if (response.status === 200 && data.status === "SUCCESS") {
            feedback.className = "alert alert-success";
            feedback.innerText = `Access Granted! Token generated successfully.`;
            
            // Clear credentials from view inputs
            document.getElementById('username').value = "";
            document.getElementById('password').value = "";
        } else if (response.status === 403) {
            // Brute-force block threshold active
            feedback.className = "alert alert-danger";
            feedback.innerText = `SECURITY ALERT: ${data.message}`;
        } else {
            // Captures Cognito native rejections (e.g., "Incorrect username or password.")
            feedback.className = "alert alert-danger";
            feedback.innerText = `Access Denied: ${data.message || "Authentication failed"}`;
        }
    } catch (err) {
        feedback.className = "alert alert-danger";
        feedback.innerText = `Network Ingestion Failure: ${err.message}`;
        feedback.style.display = 'block';
    }
});
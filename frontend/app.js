/**
 * MSc Cybersecurity - SOAR Automation Project
 * ==========================================
 * Description: Asynchronous dashboard engine for real-time SIEM telemetry polling.
 * Security Fix: Resolves API endpoints dynamically via cloud environment injection 
 * or local fallback configuration layers to prevent public repository exposure.
 */

// Global variable placeholder to store the parsed API location
let targetApiUrl = "";

function resolveApiEndpoint() {
    // 1. Check for dynamic runtime injection via AWS Amplify/Hosting window variables
    if (window.env && window.env.API_URL) {
        return window.env.API_URL;
    }
    
    // 2. Check for local non-committed configuration file fallback (config.js)
    if (typeof API_BASE_URL !== 'undefined') {
        return API_BASE_URL;
    }
    
    return null;
}

async function fetchDashboardData() {
    // Dynamically discover infrastructure endpoint if not cached
    if (!targetApiUrl) {
        targetApiUrl = resolveApiEndpoint();
    }

    if (!targetApiUrl) {
        console.error("[SECURITY ALERT] API Endpoint is unconfigured. Execution aborted.");
        return;
    }

    try {
        const response = await fetch(`${targetApiUrl}/events`);
        if (!response.ok) throw new Error(`HTTP network anomaly detected. Status: ${response.status}`);
        
        const logs = await response.json();
        
        // Compute security telemetry metrics
        const totalLogs = logs.length;
        const successCount = logs.filter(event => event.status === 'SUCCESS').length;
        const failedCount = logs.filter(event => event.status === 'FAILED').length;
        
        // Update DOM state elements securely
        document.getElementById('stat-total').innerText = totalLogs;
        document.getElementById('stat-success').innerText = successCount;
        document.getElementById('stat-failed').innerText = failedCount;
        
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = "";
        
        // Render structured event logs into the SIEM dashboard table
        logs.forEach(log => {
            const dateStr = new Date(parseInt(log.timestamp) * 1000).toLocaleString('ro-RO');
            const badgeClass = log.status === 'SUCCESS' ? 'badge success' : 'badge failed';
            
            const row = `<tr>
                <td><code>${log.eventId.substring(0, 8)}...</code></td>
                <td><strong>${log.username}</strong></td>
                <td>${dateStr}</td>
                <td><span class="${badgeClass}">${log.status}</span></td>
                <td>${log.details}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("[SIEM ENGINE ERROR] Telemetry polling failed:", error);
    }
}

async function exportSOCReport() {
    if (!targetApiUrl) {
        targetApiUrl = resolveApiEndpoint();
    }

    try {
        const response = await fetch(`${targetApiUrl}/report`);
        if (!response.ok) throw new Error("Cloud report compilation handshake failed.");
        
        const data = await response.json();
        // Open the temporary secure pre-signed Amazon S3 URL downoad link
        window.open(data.downloadUrl, '_blank');
    } catch (error) {
        console.error("[SOAR PLAYBOOK ERROR] Forensic report generation failed:", error);
        alert("S3 Forensic Export Failed: Check console security logs.");
    }
}

// Orchestrate automated real-time polling interval loops (5000ms heartbeat)
window.onload = () => {
    fetchDashboardData();
    setInterval(fetchDashboardData, 5000);
};
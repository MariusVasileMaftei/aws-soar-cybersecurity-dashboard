/**
 * MSc Cybersecurity - SOAR Automation Project
 * ==========================================
 * Description: Asynchronous dashboard engine for real-time SIEM telemetry polling.
 * Security Fix: Resolves API endpoints dynamically via cloud environment injection 
 * or local fallback configuration layers to prevent public repository exposure.
 * SQS/SNS Telemetry: Extracted Source IP, MAC Vector mapping, and Threat Severity Levels.
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

/**
 * Cleans the base URL to prevent duplicate route suffixes (e.g., removing trailing /login)
 */
function getCleanBaseUrl(url) {
    if (!url) return "";
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/login')) {
        cleanUrl = cleanUrl.substring(0, cleanUrl.lastIndexOf('/login'));
    }
    if (cleanUrl.endsWith('/')) {
        cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl;
}

async function fetchDashboardData() {
    // Dynamically discover infrastructure endpoint if not cached
    if (!targetApiUrl) {
        const rawEndpoint = resolveApiEndpoint();
        targetApiUrl = getCleanBaseUrl(rawEndpoint);
    }

    if (!targetApiUrl) {
        console.error("[SECURITY ALERT] API Endpoint is unconfigured. Execution aborted.");
        return;
    }

    try {
        // Correctly maps route path destination to GET /events
        const response = await fetch(`${targetApiUrl}/events`);
        if (!response.ok) throw new Error(`HTTP network anomaly detected. Status: ${response.status}`);
        
        const logs = await response.json();
        
        // Compute security telemetry metrics
        const totalLogs = logs.length;
        const successCount = logs.filter(event => event.status === 'SUCCESS').length;
        const failedCount = logs.filter(event => event.status === 'FAILED').length;
        
        // Update DOM state elements securely matching new translated IDs
        document.getElementById('totalEvents').innerText = totalLogs;
        document.getElementById('successEvents').innerText = successCount;
        document.getElementById('failedEvents').innerText = failedCount;
        
        const tableBody = document.getElementById('logTableBody');
        tableBody.innerHTML = "";
        
        // Render structured event logs into the SIEM dashboard table
        logs.forEach(log => {
            const dateStr = new Date(parseInt(log.timestamp) * 1000).toLocaleString('ro-RO');
            const badgeClass = log.status === 'SUCCESS' ? 'badge success' : 'badge failed';
            
            // Dynamic Risk Assessment Mapping
            let riskLevel = log.severity ? log.severity : (log.status === 'FAILED' ? 'HIGH' : 'LOW');
            let riskClass = riskLevel === 'HIGH' || log.status === 'FAILED' ? 'risk-high' : 'risk-low';
            if (log.status === 'FAILED') riskLevel = 'HIGH'; // Double-check rule compliance

            // Context extraction from decoupled SQS payload
            const ipAddress = log.ipAddress || '127.0.0.1';
            const macAddress = log.macAddress || 'N/A (Web Vector)';
            const details = log.details || 'No additional forensic logs available';
            
            const row = `<tr>
                <td><code>${log.eventId.substring(0, 8)}...</code></td>
                <td><strong>${log.username}</strong></td>
                <td>${dateStr}</td>
                <td><span class="${badgeClass}">${log.status}</span></td>
                <td><span class="risk-badge ${riskClass}">${riskLevel}</span></td>
                <td><code>${ipAddress}</code></td>
                <td><small>${macAddress}</small></td>
                <td>${details}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (error) {
        console.error("[SIEM ENGINE ERROR] Telemetry polling failed:", error);
    }
}

async function exportSOCReport() {
    if (!targetApiUrl) {
        const rawEndpoint = resolveApiEndpoint();
        targetApiUrl = getCleanBaseUrl(rawEndpoint);
    }

    try {
        const response = await fetch(`${targetApiUrl}/report`);
        if (!response.ok) throw new Error("Cloud report compilation handshake failed.");
        
        const data = await response.json();
        // Open the temporary secure pre-signed Amazon S3 URL download link
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

    // Bind event listener to the report button securely
    const reportBtn = document.getElementById('generateReportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', exportSOCReport);
    }
};
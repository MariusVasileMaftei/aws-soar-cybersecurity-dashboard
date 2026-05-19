/**
 * MSc Cybersecurity - SOAR Automation Project
 * ==========================================
 * Description: Asynchronous dashboard engine for real-time SIEM telemetry polling.
 */

let targetApiUrl = "";

function resolveApiEndpoint() {
    if (window.env && window.env.API_URL) {
        return window.env.API_URL;
    }
    if (typeof API_BASE_URL !== 'undefined') {
        return API_BASE_URL;
    }
    return null;
}

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
    if (!targetApiUrl) {
        const rawEndpoint = resolveApiEndpoint();
        targetApiUrl = getCleanBaseUrl(rawEndpoint);
    }

    if (!targetApiUrl) {
        console.error("[SECURITY ALERT] API Endpoint is unconfigured. Execution aborted.");
        return;
    }

    try {
        const response = await fetch(`${targetApiUrl}/events`);
        if (!response.ok) throw new Error(`HTTP network anomaly detected. Status: ${response.status}`);
        
        const logs = await response.json();
        
        // Compute metrics
        const totalLogs = logs.length;
        const successCount = logs.filter(event => event.status === 'SUCCESS').length;
        const failedCount = logs.filter(event => event.status === 'FAILED').length;
        
        document.getElementById('totalEvents').innerText = totalLogs;
        document.getElementById('successEvents').innerText = successCount;
        document.getElementById('failedEvents').innerText = failedCount;
        
        const tableBody = document.getElementById('logTableBody');
        tableBody.innerHTML = "";
        
        logs.forEach(log => {
            const dateStr = new Date(parseInt(log.timestamp) * 1000).toLocaleString('ro-RO');
            const badgeClass = log.status === 'SUCCESS' ? 'badge success' : 'badge failed';
            
            // Dynamic Threat Risk Level Mapping
            let riskLevel = log.severity ? log.severity : (log.status === 'FAILED' ? 'HIGH' : 'LOW');
            let riskClass = riskLevel === 'HIGH' || log.status === 'FAILED' ? 'risk-high' : 'risk-low';
            if (log.status === 'FAILED') riskLevel = 'HIGH'; 

            // Extract telemetry data (MAC completely removed from rendering logic)
            const ipAddress = log.ipAddress || '127.0.0.1';
            const details = log.details || 'No additional forensic logs available';
            
            const row = `<tr>
                <td><code>${log.eventId.substring(0, 8)}...</code></td>
                <td><strong>${log.username}</strong></td>
                <td>${dateStr}</td>
                <td><span class="${badgeClass}">${log.status}</span></td>
                <td><span class="risk-badge ${riskClass}">${riskLevel}</span></td>
                <td><code>${ipAddress}</code></td>
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
        window.open(data.downloadUrl, '_blank');
    } catch (error) {
        console.error("[SOAR PLAYBOOK ERROR] Forensic report generation failed:", error);
        alert("S3 Forensic Export Failed: Check console security logs.");
    }
}

window.onload = () => {
    fetchDashboardData();
    setInterval(fetchDashboardData, 5000);

    const reportBtn = document.getElementById('generateReportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', exportSOCReport);
    }
};
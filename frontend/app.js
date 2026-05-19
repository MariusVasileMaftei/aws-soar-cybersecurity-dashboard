async function fetchDashboardData() {
    // Verificăm dacă URL-ul s-a încărcat corect din fișierul privat config.js
    if (typeof API_BASE_URL === 'undefined') {
        console.error("Eroare: API_BASE_URL nu este configurat local în config.js!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (!response.ok) throw new Error("Failed to fetch logs");
        const logs = await response.json();
        
        const totalLogs = logs.length;
        const successCount = logs.filter(l => l.status === 'SUCCESS').length;
        const failedCount = logs.filter(l => l.status === 'FAILED').length;
        
        document.getElementById('stat-total').innerText = totalLogs;
        document.getElementById('stat-success').innerText = successCount;
        document.getElementById('stat-failed').innerText = failedCount;
        
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = "";
        
        logs.forEach(log => {
            const dateStr = new Date(parseInt(log.timestamp) * 1000).toLocaleString('ro-RO');
            const badgeClass = log.status === 'SUCCESS' ? 'badge success' : 'badge failed';
            
            const row = `<tr>
                <td><code>${log.eventId.substring(0,8)}...</code></td>
                <td><strong>${log.username}</strong></td>
                <td>${dateStr}</td>
                <td><span class="${badgeClass}">${log.status}</span></td>
                <td>${log.details}</td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    } catch (err) {
        console.error("Dashboard error:", err);
    }
}

async function exportSOCReport() {
    try {
        const response = await fetch(`${API_BASE_URL}/report`);
        if (!response.ok) throw new Error("Failed to compile report");
        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
    } catch (err) {
        alert("Eroare export S3: " + err.message);
    }
}

// Pornire automată și auto-refresh la 5 secunde
window.onload = () => {
    fetchDashboardData();
    setInterval(fetchDashboardData, 5000);
};
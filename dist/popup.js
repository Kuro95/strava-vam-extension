// VAM Personal Bests Tracker - Popup Script v2.0
// Firefox compatible version

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

let currentMode = 'time';
let isSyncing = false;

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
}

async function loadSettings() {
    return new Promise((resolve) => {
        browserAPI.storage.local.get(['vamSettings'], (result) => {
            const defaults = {
                trackingModes: ['time', 'ascent', 'distance'],
                customConfigs: {
                    time: [],
                    ascent: [],
                    distance: []
                }
            };
            resolve(result.vamSettings || defaults);
        });
    });
}

async function loadAndDisplayData() {
    const settings = await loadSettings();
    
    browserAPI.storage.local.get(['vamPersonalBests'], (result) => {
        const pbs = result.vamPersonalBests || {};
        const contentDiv = document.getElementById('content');

        // Check if any data exists
        const hasData = Object.keys(pbs).some(mode => Object.keys(pbs[mode] || {}).length > 0);

        if (!hasData) {
            contentDiv.innerHTML = `
                <div class="no-data">
                    <div class="no-data-icon">🏔️</div>
                    <p><strong>No personal bests recorded yet</strong></p>
                    <p>Click "Sync All Activities" to load your data, or visit Strava activities manually.</p>
                </div>
            `;
            return;
        }

        // Create tabs if multiple modes
        const modeTabsDiv = document.getElementById('modeTabs');
        if (settings.trackingModes.length > 1) {
            modeTabsDiv.style.display = 'flex';
            modeTabsDiv.innerHTML = '';
            
            settings.trackingModes.forEach((mode, idx) => {
                const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
                const tab = document.createElement('button');
                tab.className = `tab ${idx === 0 ? 'active' : ''}`;
                tab.dataset.mode = mode;
                tab.textContent = modeLabel;
                tab.addEventListener('click', () => switchMode(mode));
                modeTabsDiv.appendChild(tab);
            });
            
            currentMode = settings.trackingModes[0];
        } else {
            currentMode = settings.trackingModes[0] || 'time';
            modeTabsDiv.style.display = 'none';
        }

        // Display data for current mode
        displayModeData(pbs, currentMode);
    });
}

function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });
    
    browserAPI.storage.local.get(['vamPersonalBests'], (result) => {
        const pbs = result.vamPersonalBests || {};
        displayModeData(pbs, mode);
    });
}

function displayModeData(pbs, mode) {
    const contentDiv = document.getElementById('content');
    const modePBs = pbs[mode] || {};

    if (Object.keys(modePBs).length === 0) {
        contentDiv.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">📊</div>
                <p>No ${mode} personal bests yet</p>
            </div>
        `;
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>${mode === 'time' ? 'Duration' : mode === 'ascent' ? 'Ascent' : 'Distance'}</th>
                    <th>VAM</th>
                    <th>${mode === 'distance' ? 'Gain' : mode === 'ascent' ? 'Time' : 'Gain'}</th>
                    <th>Date</th>
                    <th>Activity</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Sort by value
    const sortedLabels = Object.keys(modePBs).sort((a, b) => {
        const aVal = parseFloat(a);
        const bVal = parseFloat(b);
        return aVal - bVal;
    });

    sortedLabels.forEach(label => {
        const pb = modePBs[label];
        let extraInfo = '';
        
        if (mode === 'time') {
            extraInfo = `${pb.elevationGain} m`;
        } else if (mode === 'ascent') {
            extraInfo = formatDuration(pb.duration);
        } else if (mode === 'distance') {
            extraInfo = `${pb.elevationGain} m`;
        }

        html += `
            <tr>
                <td><strong>${label}</strong></td>
                <td class="vam-value">${pb.vam.toLocaleString()} m/h</td>
                <td>${extraInfo}</td>
                <td class="date">${formatDate(pb.date)}</td>
                <td>
                    <a href="https://www.strava.com/activities/${pb.activityId}" 
                       target="_blank" 
                       class="activity-link">
                        View →
                    </a>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    contentDiv.innerHTML = html;
}

// Bulk sync functionality
function startSync() {
    if (isSyncing) return;

    isSyncing = true;
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');
    const syncMessage = document.getElementById('syncMessage');
    const progressFill = document.getElementById('progressFill');

    syncBtn.disabled = true;
    syncBtn.textContent = '⏳ Syncing...';
    syncStatus.className = 'sync-status syncing';
    syncMessage.textContent = 'Fetching your activities...';
    progressFill.style.width = '0%';

    // Send message to background script
    browserAPI.runtime.sendMessage({ 
        action: 'syncAllActivities',
        maxActivities: 100 
    });
}

// Listen for sync progress
browserAPI.runtime.onMessage.addListener((message) => {
    const syncStatus = document.getElementById('syncStatus');
    const syncMessage = document.getElementById('syncMessage');
    const progressFill = document.getElementById('progressFill');
    const syncBtn = document.getElementById('syncBtn');

    if (message.action === 'syncProgress') {
        const percent = (message.processed / message.total * 100).toFixed(0);
        syncMessage.textContent = `Processing: ${message.processed}/${message.total} activities (${message.newPBs} new PBs)`;
        progressFill.style.width = `${percent}%`;
    } else if (message.action === 'syncComplete') {
        isSyncing = false;
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Sync All Activities';
        syncStatus.className = 'sync-status complete';
        syncMessage.textContent = `✅ Sync complete! Processed ${message.processed} activities, found ${message.newPBs} new personal bests.`;
        progressFill.style.width = '100%';

        // Reload data
        setTimeout(() => {
            loadAndDisplayData();
            syncStatus.style.display = 'none';
        }, 3000);
    } else if (message.action === 'syncError') {
        isSyncing = false;
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Sync All Activities';
        syncStatus.className = 'sync-status error';
        syncMessage.textContent = `❌ Error: ${message.error}`;

        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 5000);
    }
});

// Clear data
function clearData() {
    if (confirm('Are you sure you want to clear all VAM personal bests? This cannot be undone.')) {
        browserAPI.storage.local.remove('vamPersonalBests', () => {
            loadAndDisplayData();
        });
    }
}

// Open settings
function openSettings() {
    browserAPI.runtime.openOptionsPage();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayData();

    document.getElementById('syncBtn').addEventListener('click', startSync);
    // Leaderboard is now a direct link, no button handler needed
    document.getElementById('clearBtn').addEventListener('click', clearData);
    document.getElementById('settingsLink').addEventListener('click', (e) => {
        e.preventDefault();
        openSettings();
    });
    // Footer leaderboard link is now a direct href, no handler needed
});

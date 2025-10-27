// VAM Leaderboard Script - Firefox compatible
// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

let allActivities = [];
let currentFilters = {
  sport: 'all',
  mode: 'time',
  period: null
};
let currentSort = {
  column: 'vam',
  direction: 'desc'
};

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Get sport badge HTML
function getSportBadge(sportType) {
  const badges = {
    'Ride': '<span class="sport-badge sport-ride">🚴 Ride</span>',
    'VirtualRide': '<span class="sport-badge sport-ride">🎮 Virtual Ride</span>',
    'Run': '<span class="sport-badge sport-run">🏃 Run</span>',
    'VirtualRun': '<span class="sport-badge sport-run">🎮 Virtual Run</span>'
  };
  return badges[sportType] || '<span class="sport-badge sport-other">' + sportType + '</span>';
}

// Load activity metadata
async function loadActivityMetadata() {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['activityMetadata'], (result) => {
      resolve(result.activityMetadata || {});
    });
  });
}

// Save activity metadata - currently unused but kept for future use
// eslint-disable-next-line no-unused-vars
async function saveActivityMetadata(metadata) {
  return new Promise((resolve) => {
    browserAPI.storage.local.set({ activityMetadata: metadata }, resolve);
  });
}

// Load and process all data
async function loadLeaderboardData() {
  const [pbs, settings, metadata] = await Promise.all([
    loadPersonalBests(),
    loadSettings(),
    loadActivityMetadata()
  ]);

  // Build activities array
  const activities = [];

  Object.keys(pbs).forEach(mode => {
    Object.keys(pbs[mode]).forEach(period => {
      const pb = pbs[mode][period];
      const meta = metadata[pb.activityId] || {
        name: 'Unknown Activity',
        sportType: 'Ride',
        date: pb.date
      };

      activities.push({
        mode,
        period,
        activityId: pb.activityId,
        vam: pb.vam,
        elevationGain: pb.elevationGain,
        duration: pb.duration,
        distance: pb.distance || 0,
        date: pb.date,
        activityName: meta.name,
        sportType: meta.sportType
      });
    });
  });

  return { activities, settings };
}

// Load personal bests
async function loadPersonalBests() {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['vamPersonalBests'], (result) => {
      resolve(result.vamPersonalBests || {});
    });
  });
}

// Load settings
async function loadSettings() {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['vamSettings'], (result) => {
      const defaults = {
        trackingModes: ['time', 'ascent', 'distance'],
        customConfigs: {
          time: [
            { value: 60, label: '1 min', unit: 's' },
            { value: 120, label: '2 min', unit: 's' },
            { value: 300, label: '5 min', unit: 's' },
            { value: 600, label: '10 min', unit: 's' },
            { value: 900, label: '15 min', unit: 's' },
            { value: 1200, label: '20 min', unit: 's' },
            { value: 1800, label: '30 min', unit: 's' },
            { value: 3600, label: '60 min', unit: 's' }
          ],
          ascent: [
            { value: 100, label: '100 m', unit: 'm' },
            { value: 250, label: '250 m', unit: 'm' },
            { value: 500, label: '500 m', unit: 'm' },
            { value: 1000, label: '1000 m', unit: 'm' },
            { value: 1500, label: '1500 m', unit: 'm' }
          ],
          distance: [
            { value: 1000, label: '1 km', unit: 'm' },
            { value: 2000, label: '2 km', unit: 'm' },
            { value: 5000, label: '5 km', unit: 'm' },
            { value: 10000, label: '10 km', unit: 'm' }
          ]
        }
      };
      resolve(result.vamSettings || defaults);
    });
  });
}

// Populate period filter
function populatePeriodFilter(settings, mode) {
  const periodFilter = document.getElementById('periodFilter');
  periodFilter.innerHTML = '<option value="all">All Periods</option>';

  const configs = settings.customConfigs[mode] || [];
  configs.forEach(config => {
    const option = document.createElement('option');
    option.value = config.label;
    option.textContent = config.label;
    periodFilter.appendChild(option);
  });
}

// Display statistics
function displayStats(filteredActivities) {
  const statsContainer = document.getElementById('statsContainer');

  if (filteredActivities.length === 0) {
    statsContainer.innerHTML = '';
    return;
  }

  const totalActivities = new Set(filteredActivities.map(a => a.activityId)).size;
  const avgVAM = Math.round(filteredActivities.reduce((sum, a) => sum + a.vam, 0) / filteredActivities.length);
  const maxVAM = Math.max(...filteredActivities.map(a => a.vam));
  const totalElevation = filteredActivities.reduce((sum, a) => sum + (a.elevationGain || 0), 0);

  // eslint-disable-next-line no-unsanitized/property
  statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Activities</div>
            <div class="stat-value">${totalActivities}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Average VAM</div>
            <div class="stat-value">${avgVAM.toLocaleString()} m/h</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Best VAM</div>
            <div class="stat-value">${maxVAM.toLocaleString()} m/h</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Elevation</div>
            <div class="stat-value">${Math.round(totalElevation).toLocaleString()} m</div>
        </div>
    `;
}

// Filter and sort activities
function filterAndSortActivities() {
  let filtered = [...allActivities];

  // Apply sport filter
  if (currentFilters.sport !== 'all') {
    filtered = filtered.filter(a => a.sportType === currentFilters.sport);
  }

  // Apply mode filter
  filtered = filtered.filter(a => a.mode === currentFilters.mode);

  // Apply period filter
  if (currentFilters.period && currentFilters.period !== 'all') {
    filtered = filtered.filter(a => a.period === currentFilters.period);
  }

  // Sort
  filtered.sort((a, b) => {
    let aVal, bVal;

    switch (currentSort.column) {
    case 'vam':
      aVal = a.vam;
      bVal = b.vam;
      break;
    case 'date':
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
      break;
    case 'elevation':
      aVal = a.elevationGain || 0;
      bVal = b.elevationGain || 0;
      break;
    case 'duration':
      aVal = a.duration || 0;
      bVal = b.duration || 0;
      break;
    case 'period':
      aVal = parseFloat(a.period);
      bVal = parseFloat(b.period);
      break;
    default:
      return 0;
    }

    if (currentSort.direction === 'asc') {
      return aVal - bVal;
    }
    return bVal - aVal;

  });

  return filtered;
}

// Display leaderboard table
function displayLeaderboard(activities) {
  const contentDiv = document.getElementById('content');

  if (activities.length === 0) {
    contentDiv.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">🏆</div>
                <p><strong>No activities found</strong></p>
                <p>Try adjusting your filters or visit more Strava activities.</p>
            </div>
        `;
    return;
  }

  let html = `
        <table>
            <thead>
                <tr>
                    <th class="sortable" data-column="rank" style="width: 60px; text-align: center;">Rank</th>
                    <th class="sortable ${currentSort.column === 'period' ? 'sorted-' + currentSort.direction : ''}" data-column="period">Period</th>
                    <th class="sortable ${currentSort.column === 'vam' ? 'sorted-' + currentSort.direction : ''}" data-column="vam">VAM</th>
                    <th class="sortable ${currentSort.column === 'elevation' ? 'sorted-' + currentSort.direction : ''}" data-column="elevation">Elevation</th>
                    <th class="sortable ${currentSort.column === 'duration' ? 'sorted-' + currentSort.direction : ''}" data-column="duration">Duration</th>
                    <th class="sortable ${currentSort.column === 'date' ? 'sorted-' + currentSort.direction : ''}" data-column="date">Date</th>
                    <th>Sport</th>
                    <th>Activity</th>
                </tr>
            </thead>
            <tbody>
    `;

  activities.forEach((activity, index) => {
    const rank = index + 1;
    let rankClass = 'rank';
    let rankDisplay = rank;

    if (rank === 1) {
      rankClass += ' gold';
      rankDisplay = '🥇';
    } else if (rank === 2) {
      rankClass += ' silver';
      rankDisplay = '🥈';
    } else if (rank === 3) {
      rankClass += ' bronze';
      rankDisplay = '🥉';
    }

    html += `
            <tr>
                <td class="${rankClass}">${rankDisplay}</td>
                <td><strong>${activity.period}</strong></td>
                <td class="vam-value">${activity.vam.toLocaleString()} m/h</td>
                <td>${(activity.elevationGain || 0).toLocaleString()} m</td>
                <td>${formatDuration(activity.duration || 0)}</td>
                <td class="date">${formatDate(activity.date)}</td>
                <td>${getSportBadge(activity.sportType)}</td>
                <td>
                    <div class="activity-name" title="${activity.activityName}">${activity.activityName.substring(0, 30)}${activity.activityName.length > 30 ? '...' : ''}</div>
                    <a href="https://www.strava.com/activities/${activity.activityId}" 
                       target="_blank" 
                       class="activity-link">
                        View Activity →
                    </a>
                </td>
            </tr>
        `;
  });

  html += `
            </tbody>
        </table>
    `;

  // eslint-disable-next-line no-unsanitized/property
  contentDiv.innerHTML = html;

  // Add sort handlers
  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.dataset.column;
      if (column === 'rank') {return;} // Don't allow sorting by rank

      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = 'desc';
      }

      updateDisplay();
    });
  });
}

// Update display
function updateDisplay() {
  const filtered = filterAndSortActivities();
  displayStats(filtered);
  displayLeaderboard(filtered);
}

// Initialize
async function init() {
  const { activities, settings } = await loadLeaderboardData();
  allActivities = activities;

  // Populate period filter
  populatePeriodFilter(settings, currentFilters.mode);

  // Set up event listeners
  document.getElementById('sportFilter').addEventListener('change', (e) => {
    currentFilters.sport = e.target.value;
    updateDisplay();
  });

  document.getElementById('modeFilter').addEventListener('change', (e) => {
    currentFilters.mode = e.target.value;
    populatePeriodFilter(settings, currentFilters.mode);
    currentFilters.period = 'all';
    document.getElementById('periodFilter').value = 'all';
    updateDisplay();
  });

  document.getElementById('periodFilter').addEventListener('change', (e) => {
    currentFilters.period = e.target.value;
    updateDisplay();
  });

  document.getElementById('settingsLink').addEventListener('click', (e) => {
    e.preventDefault();
    browserAPI.runtime.openOptionsPage();
  });

  // Initial display
  updateDisplay();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

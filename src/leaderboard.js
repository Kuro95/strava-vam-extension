// VAM Leaderboard Script - Enhanced with full activity ranking
// Firefox compatible with IndexedDB storage support

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// State
let allActivities = [];
let currentView = 'pbs'; // 'pbs' or 'activities'
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
  if (typeof VAMCalculator !== 'undefined') {
    return VAMCalculator.formatDuration(seconds);
  }
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
    'Ride': '<span class="sport-badge sport-ride">Ride</span>',
    'VirtualRide': '<span class="sport-badge sport-ride">Virtual</span>',
    'Run': '<span class="sport-badge sport-run">Run</span>',
    'VirtualRun': '<span class="sport-badge sport-run">V-Run</span>'
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
      const defaultConfigs = (typeof VAMCalculator !== 'undefined')
        ? VAMCalculator.DEFAULT_CONFIGS
        : {
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
        };

      const defaults = {
        trackingModes: ['time', 'ascent', 'distance'],
        customConfigs: defaultConfigs
      };
      resolve(result.vamSettings || defaults);
    });
  });
}

// Load all stored activities from IndexedDB
async function loadStoredActivities() {
  if (typeof ActivityStorage === 'undefined') {
    console.warn('ActivityStorage not available');
    return [];
  }

  try {
    return await ActivityStorage.getAllActivities();
  } catch (error) {
    console.error('Error loading stored activities:', error);
    return [];
  }
}

// Load computed results for all activities
async function loadAllComputedResults() {
  if (typeof ActivityStorage === 'undefined') {
    return [];
  }

  try {
    return await ActivityStorage.getAllComputedResults();
  } catch (error) {
    console.error('Error loading computed results:', error);
    return [];
  }
}

// Load and process all data for PBs view
async function loadPBsData() {
  const [pbs, settings, metadata] = await Promise.all([
    loadPersonalBests(),
    loadSettings(),
    loadActivityMetadata()
  ]);

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

// Load and process all data for Activities view (full ranking)
async function loadActivitiesData() {
  const [storedActivities, computedResults, settings] = await Promise.all([
    loadStoredActivities(),
    loadAllComputedResults(),
    loadSettings()
  ]);

  // Create a map of computed results by activity ID
  const resultsMap = {};
  computedResults.forEach(r => {
    resultsMap[r.activityId] = r.results;
  });

  // Build activities array with VAM data for ranking
  const activities = [];

  for (const stored of storedActivities) {
    let results = resultsMap[stored.activityId];

    // If no cached results, compute them now
    if (!results && stored.streams && typeof VAMCalculator !== 'undefined') {
      results = VAMCalculator.processActivity(stored.streams, settings);
    }

    if (!results) {continue;}

    // Add an entry for each mode/period combination
    Object.keys(results).forEach(mode => {
      Object.keys(results[mode]).forEach(period => {
        const effort = results[mode][period];
        if (effort.vam > 0) {
          activities.push({
            mode,
            period,
            activityId: stored.activityId,
            vam: effort.vam,
            elevationGain: effort.elevationGain,
            duration: effort.duration,
            distance: effort.distance || 0,
            date: stored.metadata?.date || stored.syncedAt,
            activityName: stored.metadata?.name || 'Unknown Activity',
            sportType: stored.metadata?.sportType || 'Ride'
          });
        }
      });
    });
  }

  return { activities, settings, storedCount: storedActivities.length };
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
function displayStats(filteredActivities, storedCount = 0) {
  const statsContainer = document.getElementById('statsContainer');

  if (filteredActivities.length === 0) {
    // eslint-disable-next-line no-unsanitized/property
    statsContainer.innerHTML = currentView === 'activities' && storedCount > 0
      ? `<div class="stat-card"><div class="stat-label">Stored Activities</div><div class="stat-value">${storedCount}</div></div>`
      : '';
    return;
  }

  const totalActivities = new Set(filteredActivities.map(a => a.activityId)).size;
  const avgVAM = Math.round(filteredActivities.reduce((sum, a) => sum + a.vam, 0) / filteredActivities.length);
  const maxVAM = Math.max(...filteredActivities.map(a => a.vam));
  const totalElevation = filteredActivities.reduce((sum, a) => sum + (a.elevationGain || 0), 0);

  let statsHtml = `
    <div class="stat-card">
        <div class="stat-label">${currentView === 'pbs' ? 'Personal Bests' : 'Activities'}</div>
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

  if (currentView === 'activities' && storedCount > 0) {
    statsHtml += `
      <div class="stat-card">
          <div class="stat-label">Stored Activities</div>
          <div class="stat-value">${storedCount}</div>
      </div>
    `;
  }

  // eslint-disable-next-line no-unsanitized/property
  statsContainer.innerHTML = statsHtml;
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
    let message = currentView === 'pbs'
      ? 'Try adjusting your filters or visit more Strava activities.'
      : 'Sync your activities first to see rankings across all rides.';

    // eslint-disable-next-line no-unsanitized/property
    contentDiv.innerHTML = `
      <div class="no-data">
          <div class="no-data-icon">&#127942;</div>
          <p><strong>No activities found</strong></p>
          <p>${message}</p>
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
      rankDisplay = '1st';
    } else if (rank === 2) {
      rankClass += ' silver';
      rankDisplay = '2nd';
    } else if (rank === 3) {
      rankClass += ' bronze';
      rankDisplay = '3rd';
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
                  View on Strava
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
      if (column === 'rank') {return;}

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
let storedCount = 0;
function updateDisplay() {
  const filtered = filterAndSortActivities();
  displayStats(filtered, storedCount);
  displayLeaderboard(filtered);
}

// Switch between views
async function switchView(view) {
  currentView = view;

  // Update tab styles
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });

  // Load appropriate data
  if (view === 'pbs') {
    const { activities, settings } = await loadPBsData();
    allActivities = activities;
    storedCount = 0;
    populatePeriodFilter(settings, currentFilters.mode);
  } else {
    const { activities, settings, storedCount: count } = await loadActivitiesData();
    allActivities = activities;
    storedCount = count;
    populatePeriodFilter(settings, currentFilters.mode);
  }

  updateDisplay();
}

// Reprocess all activities
async function reprocessActivities() {
  const reprocessBtn = document.getElementById('reprocessBtn');
  if (reprocessBtn) {
    reprocessBtn.disabled = true;
    reprocessBtn.textContent = 'Reprocessing...';
  }

  browserAPI.runtime.sendMessage({ action: 'reprocessAllActivities' });
}

// Initialize
async function init() {
  // Wait for modules
  const waitForModules = (callback, maxWait = 3000) => {
    const start = Date.now();
    const check = () => {
      if (typeof ActivityStorage !== 'undefined') {
        callback();
      } else if (Date.now() - start < maxWait) {
        setTimeout(check, 50);
      } else {
        console.warn('ActivityStorage not available, using PBs only');
        callback();
      }
    };
    check();
  };

  waitForModules(async () => {
    // Load initial data (PBs view)
    const { activities, settings } = await loadPBsData();
    allActivities = activities;

    // Populate period filter
    populatePeriodFilter(settings, currentFilters.mode);

    // Set up view tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchView(tab.dataset.view);
      });
    });

    // Set up filter event listeners
    document.getElementById('sportFilter').addEventListener('change', (e) => {
      currentFilters.sport = e.target.value;
      updateDisplay();
    });

    document.getElementById('modeFilter').addEventListener('change', async (e) => {
      currentFilters.mode = e.target.value;
      const settings = await loadSettings();
      populatePeriodFilter(settings, currentFilters.mode);
      currentFilters.period = 'all';
      document.getElementById('periodFilter').value = 'all';
      updateDisplay();
    });

    document.getElementById('periodFilter').addEventListener('change', (e) => {
      currentFilters.period = e.target.value;
      updateDisplay();
    });

    document.getElementById('settingsLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      browserAPI.runtime.openOptionsPage();
    });

    document.getElementById('reprocessBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      reprocessActivities();
    });

    // Listen for reprocess progress
    browserAPI.runtime.onMessage.addListener((message) => {
      if (message.action === 'reprocessProgress') {
        const reprocessBtn = document.getElementById('reprocessBtn');
        if (reprocessBtn) {
          reprocessBtn.textContent = `Reprocessing... ${message.processed}/${message.total}`;
        }
      } else if (message.action === 'reprocessComplete') {
        const reprocessBtn = document.getElementById('reprocessBtn');
        if (reprocessBtn) {
          reprocessBtn.disabled = false;
          reprocessBtn.textContent = 'Reprocess All';
        }
        // Reload current view
        switchView(currentView);
      }
    });

    // Initial display
    updateDisplay();
  });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

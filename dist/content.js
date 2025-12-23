// VAM Personal Bests Tracker - Content Script v2.0
// Enhanced with multiple tracking modes and custom values
// Firefox compatible version

(function () {
  'use strict';

  // Browser API compatibility
  const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

  // Default tracking configurations
  const DEFAULT_CONFIGS = {
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

  // Calculate VAM (Vertical Ascent Meters per hour)
  function calculateVAM(elevationGain, timeSeconds) {
    if (timeSeconds === 0) {return 0;}
    return (elevationGain / (timeSeconds / 3600));
  }

  // Calculate cumulative elevation gain for a segment (sum of positive changes)
  // This is the correct method for VAM - not just end - start elevation
  function calculateCumulativeElevationGain(elevationStream, startIdx, endIdx) {
    let cumulativeGain = 0;
    for (let k = startIdx + 1; k <= endIdx; k++) {
      const diff = elevationStream[k] - elevationStream[k - 1];
      if (diff > 0) {
        cumulativeGain += diff;
      }
    }
    return cumulativeGain;
  }

  // Apply simple moving average smoothing to elevation data
  // This reduces GPS noise without changing overall elevation profile
  function smoothElevationData(elevationStream, windowSize = 3) {
    if (elevationStream.length < windowSize) {return elevationStream;}

    const smoothed = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < elevationStream.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - halfWindow); j <= Math.min(elevationStream.length - 1, i + halfWindow); j++) {
        sum += elevationStream[j];
        count++;
      }

      smoothed.push(sum / count);
    }

    return smoothed;
  }

  // Find best VAM efforts by TIME
  function findBestVAMByTime(elevationStream, timeStream, targetSeconds, tolerance = 0.1) {
    let maxVAM = 0;
    let bestEffort = null;

    // Apply smoothing to reduce GPS noise
    const smoothedElevation = smoothElevationData(elevationStream, 3);

    // Minimum elevation gain threshold to avoid noise (5 meters for time-based)
    const minElevationGain = 5;

    for (let i = 0; i < smoothedElevation.length; i++) {
      for (let j = i + 1; j < smoothedElevation.length; j++) {
        const timeDiff = timeStream[j] - timeStream[i];

        if (Math.abs(timeDiff - targetSeconds) <= targetSeconds * tolerance) {
          // Use cumulative elevation gain (sum of positive changes)
          const elevGain = calculateCumulativeElevationGain(smoothedElevation, i, j);

          if (elevGain >= minElevationGain) {
            const vam = calculateVAM(elevGain, timeDiff);

            if (vam > maxVAM) {
              maxVAM = vam;
              bestEffort = {
                vam: Math.round(vam),
                elevationGain: Math.round(elevGain),
                duration: Math.round(timeDiff),
                startIdx: i,
                endIdx: j
              };
            }
          }
        }

        if (timeDiff > targetSeconds * (1 + tolerance)) {break;}
      }
    }

    return bestEffort || { vam: 0, elevationGain: 0, duration: targetSeconds };
  }

  // Find best VAM efforts by ASCENT (elevation gain)
  function findBestVAMByAscent(elevationStream, timeStream, targetAscent, tolerance = 0.1) {
    let maxVAM = 0;
    let bestEffort = null;

    // Apply smoothing to reduce GPS noise
    const smoothedElevation = smoothElevationData(elevationStream, 3);

    // For ascent-based, we want at least 90% of target to ensure meaningful segments
    const minElevationGain = targetAscent * 0.9;

    for (let i = 0; i < smoothedElevation.length; i++) {
      for (let j = i + 1; j < smoothedElevation.length; j++) {
        // Use cumulative elevation gain (sum of positive changes)
        const elevGain = calculateCumulativeElevationGain(smoothedElevation, i, j);

        if (Math.abs(elevGain - targetAscent) <= targetAscent * tolerance) {
          const timeDiff = timeStream[j] - timeStream[i];

          if (timeDiff > 0 && elevGain >= minElevationGain) {
            const vam = calculateVAM(elevGain, timeDiff);

            if (vam > maxVAM) {
              maxVAM = vam;
              bestEffort = {
                vam: Math.round(vam),
                elevationGain: Math.round(elevGain),
                duration: Math.round(timeDiff),
                startIdx: i,
                endIdx: j
              };
            }
          }
        }

        if (elevGain > targetAscent * (1 + tolerance)) {break;}
      }
    }

    return bestEffort || { vam: 0, elevationGain: 0, duration: 0 };
  }

  // Find best VAM efforts by DISTANCE
  function findBestVAMByDistance(elevationStream, timeStream, distanceStream, targetDistance, tolerance = 0.1) {
    if (!distanceStream) {return { vam: 0, elevationGain: 0, duration: 0, distance: targetDistance };}

    let maxVAM = 0;
    let bestEffort = null;

    // Apply smoothing to reduce GPS noise
    const smoothedElevation = smoothElevationData(elevationStream, 3);

    // Minimum elevation gain threshold (5 meters for distance-based)
    const minElevationGain = 5;

    for (let i = 0; i < smoothedElevation.length; i++) {
      for (let j = i + 1; j < smoothedElevation.length; j++) {
        const distDiff = distanceStream[j] - distanceStream[i];

        if (Math.abs(distDiff - targetDistance) <= targetDistance * tolerance) {
          // Use cumulative elevation gain (sum of positive changes)
          const elevGain = calculateCumulativeElevationGain(smoothedElevation, i, j);
          const timeDiff = timeStream[j] - timeStream[i];

          if (elevGain >= minElevationGain && timeDiff > 0) {
            const vam = calculateVAM(elevGain, timeDiff);

            if (vam > maxVAM) {
              maxVAM = vam;
              bestEffort = {
                vam: Math.round(vam),
                elevationGain: Math.round(elevGain),
                duration: Math.round(timeDiff),
                distance: Math.round(distDiff),
                startIdx: i,
                endIdx: j
              };
            }
          }
        }

        if (distDiff > targetDistance * (1 + tolerance)) {break;}
      }
    }

    return bestEffort || { vam: 0, elevationGain: 0, duration: 0, distance: targetDistance };
  }

  // Get activity data from Strava with retry logic
  async function getActivityData(retries = 3) {
    try {
      const activityId = window.location.pathname.match(/\/activities\/(\d+)/)?.[1];
      if (!activityId) {
        console.log('VAM Extension: Not on an activity page');
        return null;
      }

      const streamUrl = `https://www.strava.com/activities/${activityId}/streams?stream_types[]=altitude&stream_types[]=time&stream_types[]=distance`;

      let response;
      let lastError;

      // Retry logic for API calls
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          response = await fetch(streamUrl, { credentials: 'same-origin' });
          if (response.ok) {break;}
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (fetchError) {
          lastError = fetchError;
          if (attempt < retries - 1) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // Exponential backoff
          }
        }
      }

      if (!response || !response.ok) {
        console.error('VAM Extension: Failed to fetch activity streams after retries', lastError);
        return { error: 'fetch_failed', message: 'Could not load activity data. Please refresh the page.' };
      }

      const data = await response.json();

      const altitudeData = data.altitude || data.find(s => s.type === 'altitude');
      const timeData = data.time || data.find(s => s.type === 'time');
      const distanceData = data.distance || data.find(s => s.type === 'distance');

      if (!altitudeData || !timeData) {
        console.log('VAM Extension: Activity has no elevation or time data');
        return { error: 'no_elevation', message: 'This activity has no elevation data.' };
      }

      // Extract activity metadata from the page with multiple fallback selectors
      const activityName = extractActivityName();
      const sportType = extractSportType();

      return {
        activityId,
        elevation: altitudeData.data || altitudeData,
        time: timeData.data || timeData,
        distance: distanceData ? (distanceData.data || distanceData) : null,
        metadata: {
          name: activityName,
          sportType,
          date: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('VAM Extension: Error fetching activity data:', error);
      return { error: 'unknown', message: 'An unexpected error occurred.' };
    }
  }

  // Extract activity name with multiple fallback selectors
  function extractActivityName() {
    const selectors = [
      '.activity-name',
      'h1.text-title1',
      'h1.Activity_name',
      '[data-testid="activity_name"]',
      'h1[class*="activity"]',
      'h1[class*="Activity"]',
      '.Activity--heading h1',
      'header h1',
      'h1'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element?.textContent?.trim()) {
        return element.textContent.trim();
      }
    }
    return 'Untitled Activity';
  }

  // Extract sport type with multiple fallback selectors
  function extractSportType() {
    // Try data attribute first
    const dataElement = document.querySelector('[data-sport-type]');
    if (dataElement?.dataset?.sportType) {
      return dataElement.dataset.sportType;
    }

    // Try various class-based selectors
    const iconSelectors = [
      '.activity-icon',
      '[class*="activity-icon"]',
      '[class*="sport-icon"]',
      '.Activity_icon',
      '[data-testid="activity_icon"]'
    ];

    for (const selector of iconSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const match = element.className.match(/icon-([a-z]+)/i) ||
                      element.className.match(/sport-([a-z]+)/i) ||
                      element.className.match(/activity-type-([a-z]+)/i);
        if (match) {return match[1];}
      }
    }

    // Try to detect from page content
    const pageText = document.body.innerText.toLowerCase();
    if (pageText.includes('virtual ride') || pageText.includes('zwift')) {return 'VirtualRide';}
    if (pageText.includes('run') && !pageText.includes('running')) {return 'Run';}

    return 'Ride';
  }

  // Save activity metadata
  async function saveActivityMetadata(activityId, metadata) {
    return new Promise((resolve) => {
      browserAPI.storage.local.get(['activityMetadata'], (result) => {
        const allMetadata = result.activityMetadata || {};
        allMetadata[activityId] = metadata;
        browserAPI.storage.local.set({ activityMetadata: allMetadata }, resolve);
      });
    });
  }

  // Load settings
  async function loadSettings() {
    return new Promise((resolve) => {
      browserAPI.storage.local.get(['vamSettings'], (result) => {
        const defaults = {
          trackingModes: ['time', 'ascent', 'distance'], // All modes enabled by default
          customConfigs: DEFAULT_CONFIGS
        };
        resolve(result.vamSettings || defaults);
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

  // Save personal bests
  async function savePersonalBests(pbs) {
    return new Promise((resolve) => {
      browserAPI.storage.local.set({ vamPersonalBests: pbs }, resolve);
    });
  }

  // Process activity and find all peaks
  function processActivity(activityData, settings) {
    const results = {};
    const configs = settings.customConfigs || DEFAULT_CONFIGS;

    // Process each tracking mode
    if (settings.trackingModes.includes('time')) {
      results.time = {};
      configs.time.forEach(config => {
        results.time[config.label] = findBestVAMByTime(
          activityData.elevation,
          activityData.time,
          config.value
        );
      });
    }

    if (settings.trackingModes.includes('ascent')) {
      results.ascent = {};
      configs.ascent.forEach(config => {
        results.ascent[config.label] = findBestVAMByAscent(
          activityData.elevation,
          activityData.time,
          config.value
        );
      });
    }

    if (settings.trackingModes.includes('distance') && activityData.distance) {
      results.distance = {};
      configs.distance.forEach(config => {
        results.distance[config.label] = findBestVAMByDistance(
          activityData.elevation,
          activityData.time,
          activityData.distance,
          config.value
        );
      });
    }

    return results;
  }

  // Update personal bests
  async function updatePersonalBests(activityId, currentResults) {
    const allPBs = await loadPersonalBests();
    const newPBs = {};
    let hasNewPB = false;

    Object.keys(currentResults).forEach(mode => {
      if (!allPBs[mode]) {allPBs[mode] = {};}
      if (!newPBs[mode]) {newPBs[mode] = {};}

      Object.keys(currentResults[mode]).forEach(label => {
        const current = currentResults[mode][label];
        const existing = allPBs[mode][label];

        if (!existing || current.vam > existing.vam) {
          newPBs[mode][label] = {
            ...current,
            activityId,
            date: new Date().toISOString()
          };
          allPBs[mode][label] = newPBs[mode][label];
          hasNewPB = true;
        }
      });
    });

    if (hasNewPB) {
      await savePersonalBests(allPBs);
    }

    return { hasNewPB, newPBs, allPBs };
  }

  // Format duration for display
  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
  }

  // Find injection point with multiple fallback selectors
  function findInjectionPoint() {
    const selectors = [
      // Classic Strava selectors
      '.section.more-stats',
      '.spans8.activity-stats',
      '.activity-summary',
      // Modern Strava selectors (React-based)
      '[data-testid="activity_stats"]',
      '[class*="ActivityStats"]',
      '[class*="activity-stats"]',
      '.Activity--stats',
      // Sidebar selectors
      '.sidebar .section',
      'aside .section',
      '[class*="Sidebar"] section',
      // Generic fallbacks
      'section[class*="stats"]',
      '.activity-detail-view section',
      'main section:first-of-type'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('VAM Extension: Found injection point using selector:', selector);
        return element;
      }
    }

    // Last resort: try to find any section in the sidebar area
    const sidebar = document.querySelector('aside, .sidebar, [class*="sidebar"], [class*="Sidebar"]');
    if (sidebar) {
      const section = sidebar.querySelector('section, .section, div');
      if (section) {
        console.log('VAM Extension: Found injection point in sidebar');
        return section;
      }
    }

    return null;
  }

  // Create display widget
  async function displayVAMInfo() {
    if (document.getElementById('vam-pb-container')) {return;}

    const activityData = await getActivityData();

    // Handle errors with user-visible messages
    if (!activityData) {
      console.log('VAM Extension: Not on an activity page or no data available');
      return;
    }

    if (activityData.error) {
      displayErrorWidget(activityData.message);
      return;
    }

    const settings = await loadSettings();
    const currentResults = processActivity(activityData, settings);
    const { hasNewPB, newPBs, allPBs } = await updatePersonalBests(activityData.activityId, currentResults);

    // Save activity metadata if new PB found
    if (hasNewPB && activityData.metadata) {
      await saveActivityMetadata(activityData.activityId, activityData.metadata);
    }

    // Get leaderboard URL for links
    const leaderboardUrl = browserAPI.runtime.getURL('leaderboard.html');

    const sidebarStats = findInjectionPoint();

    if (!sidebarStats) {
      console.warn('VAM Extension: Could not find injection point on page');
      // Try to create a floating widget as fallback
      displayFloatingWidget(activityData, settings, currentResults, hasNewPB, newPBs, allPBs, leaderboardUrl);
      return;
    }

    const container = document.createElement('div');
    container.id = 'vam-pb-container';
    container.className = 'vam-pb-widget';

    let html = `
            <div class="vam-pb-header">
                <h3>🏔️ VAM Personal Bests</h3>
                ${hasNewPB ? '<span class="new-pb-badge">NEW PB!</span>' : ''}
            </div>
            <div class="vam-pb-content">
        `;

    // Show all modes without tabs - just section headers
    settings.trackingModes.forEach((mode, _idx) => {
      const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      let modeIcon;
      if (mode === 'time') {
        modeIcon = '⏱️';
      } else if (mode === 'ascent') {
        modeIcon = '⛰️';
      } else {
        modeIcon = '📏';
      }

      let firstColumnHeader;
      if (mode === 'time') {
        firstColumnHeader = 'Duration';
      } else if (mode === 'ascent') {
        firstColumnHeader = 'Ascent';
      } else {
        firstColumnHeader = 'Distance';
      }

      let fourthColumnHeader;
      if (mode === 'distance') {
        fourthColumnHeader = 'Gain';
      } else if (mode === 'ascent') {
        fourthColumnHeader = 'Time';
      } else {
        fourthColumnHeader = 'Gain';
      }

      html += `
                <div class="vam-mode-section">
                    <h4 class="vam-mode-header">${modeIcon} ${modeLabel}-Based VAM</h4>
                    <table class="vam-pb-table">
                        <thead>
                            <tr>
                                <th>${firstColumnHeader}</th>
                                <th>Current VAM</th>
                                <th>Best VAM</th>
                                <th>${fourthColumnHeader}</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      const configs = settings.customConfigs[mode] || [];
      configs.forEach(config => {
        const label = config.label;
        const current = currentResults[mode]?.[label] || { vam: 0 };
        const pb = allPBs[mode]?.[label];
        const isNewPB = newPBs[mode]?.[label] !== undefined;

        const currentVAM = current.vam || 0;
        const pbVAM = pb ? pb.vam : 0;

        let extraInfo = '';
        if (mode === 'time') {
          extraInfo = current.elevationGain > 0 ? `${current.elevationGain} m` : '-';
        } else if (mode === 'ascent') {
          extraInfo = current.duration > 0 ? formatDuration(current.duration) : '-';
        } else if (mode === 'distance') {
          extraInfo = current.elevationGain > 0 ? `${current.elevationGain} m` : '-';
        }

        const rowClass = isNewPB ? 'new-pb-row' : '';
        const isPBOnThisActivity = pb && pb.activityId === activityData.activityId;

        html += `
                    <tr class="${rowClass}">
                        <td><strong>${label}</strong></td>
                        <td>${currentVAM > 0 ? currentVAM.toLocaleString() + ' m/h' : '-'}</td>
                        <td class="${isPBOnThisActivity ? 'current-pb' : ''}">
                            ${pbVAM > 0 ? pbVAM.toLocaleString() + ' m/h' : '-'}
                            ${isNewPB ? ' ⭐' : ''}
                        </td>
                        <td>${extraInfo}</td>
                    </tr>
                `;
      });

      html += `
                        </tbody>
                    </table>
                </div>
            `;
    });

    html += `
                <div class="vam-pb-footer">
                    <button id="vam-sync-button" class="vam-sync-btn">🔄 Sync All Activities</button>
                    <small>VAM = Vertical Ascent Meters per hour • <a href="${leaderboardUrl}" target="_blank">Leaderboard</a> • <a href="javascript:void(0)" id="vam-settings-link">Settings</a></small>
                </div>
            </div>
        `;

    // eslint-disable-next-line no-unsanitized/property
    container.innerHTML = html;
    sidebarStats.parentNode.insertBefore(container, sidebarStats.nextSibling);

    // Sync button handler
    document.getElementById('vam-sync-button')?.addEventListener('click', (e) => {
      e.preventDefault();
      browserAPI.runtime.sendMessage({ action: 'syncAllActivities', maxActivities: 100 });
      alert('Sync started! This will take a few minutes. Check the extension popup for progress.');
    });

    // Settings link
    document.getElementById('vam-settings-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      browserAPI.runtime.sendMessage({ action: 'openOptions' });
    });

    // Leaderboard link is now a direct href, no handler needed

    console.log('VAM Personal Bests displayed', { hasNewPB, currentResults, allPBs });
  }

  // Display error widget when data can't be loaded
  function displayErrorWidget(errorMessage) {
    const injectionPoint = findInjectionPoint();
    if (!injectionPoint) {return;}

    if (document.getElementById('vam-pb-container')) {return;}

    const container = document.createElement('div');
    container.id = 'vam-pb-container';
    container.className = 'vam-pb-widget vam-error-widget';

    // Build the widget using DOM methods for safety
    const header = document.createElement('div');
    header.className = 'vam-pb-header';
    const h3 = document.createElement('h3');
    h3.textContent = '🏔️ VAM Personal Bests';
    header.appendChild(h3);

    const content = document.createElement('div');
    content.className = 'vam-pb-content';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'vam-error-message';

    const icon = document.createElement('span');
    icon.className = 'vam-error-icon';
    icon.textContent = '⚠️';

    const msgP = document.createElement('p');
    msgP.textContent = errorMessage;

    const retryBtn = document.createElement('button');
    retryBtn.id = 'vam-retry-button';
    retryBtn.className = 'vam-retry-btn';
    retryBtn.textContent = '🔄 Retry';

    errorDiv.appendChild(icon);
    errorDiv.appendChild(msgP);
    errorDiv.appendChild(retryBtn);
    content.appendChild(errorDiv);

    container.appendChild(header);
    container.appendChild(content);

    injectionPoint.parentNode.insertBefore(container, injectionPoint.nextSibling);

    retryBtn.addEventListener('click', () => {
      container.remove();
      setTimeout(displayVAMInfo, 500);
    });
  }

  // Display floating widget when no injection point found
  function displayFloatingWidget(activityData, settings, currentResults, hasNewPB, newPBs, allPBs, leaderboardUrl) {
    if (document.getElementById('vam-pb-container')) {return;}

    const container = document.createElement('div');
    container.id = 'vam-pb-container';
    container.className = 'vam-pb-widget vam-floating-widget';

    let html = `
      <div class="vam-pb-header">
        <h3>🏔️ VAM Personal Bests</h3>
        ${hasNewPB ? '<span class="new-pb-badge">NEW PB!</span>' : ''}
        <button id="vam-close-float" class="vam-close-btn">×</button>
      </div>
      <div class="vam-pb-content vam-compact">
    `;

    // Simplified display for floating widget
    settings.trackingModes.forEach(mode => {
      const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
      const configs = settings.customConfigs[mode] || [];
      const topResult = configs
        .map(c => currentResults[mode]?.[c.label])
        .filter(r => r && r.vam > 0)
        .sort((a, b) => b.vam - a.vam)[0];

      if (topResult) {
        const isNewPB = Boolean(Object.keys(newPBs[mode] || {}).length);
        html += `
          <div class="vam-float-item ${isNewPB ? 'new-pb-row' : ''}">
            <span class="vam-float-label">${modeLabel}</span>
            <span class="vam-float-value">${topResult.vam.toLocaleString()} m/h ${isNewPB ? '⭐' : ''}</span>
          </div>
        `;
      }
    });

    html += `
        <div class="vam-pb-footer">
          <small><a href="${leaderboardUrl}" target="_blank">View All</a></small>
        </div>
      </div>
    `;

    // eslint-disable-next-line no-unsanitized/property
    container.innerHTML = html;
    document.body.appendChild(container);

    document.getElementById('vam-close-float')?.addEventListener('click', () => {
      container.remove();
    });

    console.log('VAM Personal Bests displayed (floating)', { hasNewPB, currentResults });
  }

  // Observe page for dynamic content loading (SPA support)
  function observePageChanges() {
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        // URL changed, try to display widget
        const existingWidget = document.getElementById('vam-pb-container');
        if (existingWidget) {
          existingWidget.remove();
        }
        setTimeout(displayVAMInfo, 1500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function init() {
    // Check if we're on an activity page
    if (!window.location.pathname.includes('/activities/')) {
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(displayVAMInfo, 1000);
        observePageChanges();
      });
    } else {
      setTimeout(displayVAMInfo, 1000);
      observePageChanges();
    }
  }

  init();
})();

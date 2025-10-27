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

  // Find best VAM efforts by TIME
  function findBestVAMByTime(elevationStream, timeStream, targetSeconds, tolerance = 0.1) {
    let maxVAM = 0;
    let bestEffort = null;

    for (let i = 0; i < elevationStream.length; i++) {
      for (let j = i + 1; j < elevationStream.length; j++) {
        const timeDiff = timeStream[j] - timeStream[i];

        if (Math.abs(timeDiff - targetSeconds) <= targetSeconds * tolerance) {
          const elevGain = elevationStream[j] - elevationStream[i];

          if (elevGain > 0) {
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

    for (let i = 0; i < elevationStream.length; i++) {
      for (let j = i + 1; j < elevationStream.length; j++) {
        const elevGain = elevationStream[j] - elevationStream[i];

        if (Math.abs(elevGain - targetAscent) <= targetAscent * tolerance) {
          const timeDiff = timeStream[j] - timeStream[i];

          if (timeDiff > 0) {
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

    for (let i = 0; i < elevationStream.length; i++) {
      for (let j = i + 1; j < elevationStream.length; j++) {
        const distDiff = distanceStream[j] - distanceStream[i];

        if (Math.abs(distDiff - targetDistance) <= targetDistance * tolerance) {
          const elevGain = elevationStream[j] - elevationStream[i];
          const timeDiff = timeStream[j] - timeStream[i];

          if (elevGain > 0 && timeDiff > 0) {
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

  // Get activity data from Strava
  async function getActivityData() {
    try {
      const activityId = window.location.pathname.match(/\/activities\/(\d+)/)?.[1];
      if (!activityId) {return null;}

      const streamUrl = `https://www.strava.com/activities/${activityId}/streams?stream_types[]=altitude&stream_types[]=time&stream_types[]=distance`;

      const response = await fetch(streamUrl, { credentials: 'same-origin' });
      if (!response.ok) {return null;}

      const data = await response.json();

      const altitudeData = data.altitude || data.find(s => s.type === 'altitude');
      const timeData = data.time || data.find(s => s.type === 'time');
      const distanceData = data.distance || data.find(s => s.type === 'distance');

      if (!altitudeData || !timeData) {return null;}

      // Extract activity metadata from the page
      const activityName = document.querySelector('.activity-name')?.textContent?.trim() ||
                                document.querySelector('h1.text-title1')?.textContent?.trim() ||
                                'Untitled Activity';
      const sportType = document.querySelector('[data-sport-type]')?.dataset?.sportType ||
                             document.querySelector('.activity-icon')?.className?.match(/icon-([a-z]+)/)?.[1] ||
                             'Ride';

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
      console.error('Error fetching activity data:', error);
      return null;
    }
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

  // Create display widget
  async function displayVAMInfo() {
    if (document.getElementById('vam-pb-container')) {return;}

    const activityData = await getActivityData();
    if (!activityData) {
      console.log('Could not fetch activity data');
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

    const sidebarStats = document.querySelector('.section.more-stats') ||
                           document.querySelector('.spans8.activity-stats') ||
                           document.querySelector('.activity-summary');

    if (!sidebarStats) {return;}

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

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', displayVAMInfo);
    } else {
      setTimeout(displayVAMInfo, 1000);
    }
  }

  init();
})();

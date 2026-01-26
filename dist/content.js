// VAM Personal Bests Tracker - Content Script v3.0
// Enhanced with IndexedDB storage and shared VAM calculator
// Firefox compatible version

(function () {
  'use strict';

  // Browser API compatibility
  const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

  // Wait for shared modules to be available (they're injected via manifest)
  function waitForModules(callback, maxWait = 5000) {
    const start = Date.now();
    const check = () => {
      if (typeof VAMCalculator !== 'undefined' && typeof ActivityStorage !== 'undefined') {
        callback();
      } else if (Date.now() - start < maxWait) {
        setTimeout(check, 50);
      } else {
        console.error('VAM Extension: Shared modules not loaded, using fallback');
        callback(); // Continue anyway with inline fallbacks
      }
    };
    check();
  }

  // Fallback DEFAULT_CONFIGS if module not loaded
  const FALLBACK_CONFIGS = {
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

  // Get activity data from Strava
  async function getActivityData() {
    try {
      const activityId = window.location.pathname.match(/\/activities\/(\d+)/)?.[1];
      if (!activityId) {return null;}

      // Check if we already have this activity stored
      let storedActivity = null;
      if (typeof ActivityStorage !== 'undefined') {
        try {
          storedActivity = await ActivityStorage.getActivity(activityId);
        } catch (e) {
          console.log('Could not check stored activity:', e);
        }
      }

      // If we have stored data, use it
      if (storedActivity && storedActivity.streams) {
        console.log('Using stored activity data for', activityId);
        return {
          activityId,
          elevation: storedActivity.streams.elevation,
          time: storedActivity.streams.time,
          distance: storedActivity.streams.distance,
          metadata: storedActivity.metadata
        };
      }

      // Otherwise, fetch from Strava
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

      const activityData = {
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

      // Store the raw activity data for future reprocessing
      if (typeof ActivityStorage !== 'undefined') {
        try {
          await ActivityStorage.saveActivity({
            activityId,
            streams: {
              elevation: activityData.elevation,
              time: activityData.time,
              distance: activityData.distance
            },
            metadata: activityData.metadata
          });
          console.log('Stored raw activity data for', activityId);
        } catch (e) {
          console.error('Failed to store activity:', e);
        }
      }

      return activityData;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      return null;
    }
  }

  // Save activity metadata (for backward compatibility)
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
        const defaultConfigs = (typeof VAMCalculator !== 'undefined')
          ? VAMCalculator.DEFAULT_CONFIGS
          : FALLBACK_CONFIGS;

        const defaults = {
          trackingModes: ['time', 'ascent', 'distance'],
          customConfigs: defaultConfigs
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

  // Process activity using shared calculator or fallback
  function processActivity(activityData, settings) {
    if (typeof VAMCalculator !== 'undefined') {
      return VAMCalculator.processActivity({
        elevation: activityData.elevation,
        time: activityData.time,
        distance: activityData.distance
      }, settings);
    }

    // Fallback: minimal inline processing (should rarely happen)
    console.warn('Using fallback VAM processing');
    return {};
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

      // Also cache computed results if storage available
      if (typeof ActivityStorage !== 'undefined') {
        try {
          const settingsHash = ActivityStorage.createSettingsHash(await loadSettings());
          await ActivityStorage.saveComputedResults(activityId, currentResults, settingsHash);
        } catch (e) {
          console.error('Failed to cache computed results:', e);
        }
      }
    }

    return { hasNewPB, newPBs, allPBs };
  }

  // Format duration for display
  function formatDuration(seconds) {
    if (typeof VAMCalculator !== 'undefined') {
      return VAMCalculator.formatDuration(seconds);
    }
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
            <h3>VAM Personal Bests</h3>
            ${hasNewPB ? '<span class="new-pb-badge">NEW PB!</span>' : ''}
        </div>
        <div class="vam-pb-content">
    `;

    // Show all modes without tabs - just section headers
    settings.trackingModes.forEach((mode, _idx) => {
      let modeIcon;
      if (mode === 'time') {
        modeIcon = 'Time';
      } else if (mode === 'ascent') {
        modeIcon = 'Ascent';
      } else {
        modeIcon = 'Distance';
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
                <h4 class="vam-mode-header">${modeIcon}-Based VAM</h4>
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
                        ${isNewPB ? ' *' : ''}
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
                <button id="vam-sync-button" class="vam-sync-btn">Sync All Activities</button>
                <small>VAM = Vertical Ascent Meters per hour | <a href="${leaderboardUrl}" target="_blank">Leaderboard</a> | <a href="javascript:void(0)" id="vam-settings-link">Settings</a></small>
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

    console.log('VAM Personal Bests displayed', { hasNewPB, currentResults, allPBs });
  }

  function init() {
    // Wait for modules to be available
    waitForModules(() => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(displayVAMInfo, 1000));
      } else {
        setTimeout(displayVAMInfo, 1000);
      }
    });
  }

  init();
})();

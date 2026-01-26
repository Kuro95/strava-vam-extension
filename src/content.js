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

  // Helper: Extract data from response in various formats
  function parseStreamResponse(data) {
    if (!data) {return null;}

    let altitudeData = null;
    let timeData = null;
    let distanceData = null;

    // Format 1: Object with named properties { altitude: [...], time: [...], distance: [...] }
    if (data.altitude && Array.isArray(data.altitude)) {
      altitudeData = data.altitude;
      timeData = data.time;
      distanceData = data.distance;
    }
    // Format 2: Object with data property { altitude: { data: [...] }, ... }
    else if (data.altitude && data.altitude.data) {
      altitudeData = data.altitude.data;
      timeData = data.time?.data;
      distanceData = data.distance?.data;
    }
    // Format 3: Array of stream objects [{ type: 'altitude', data: [...] }, ...]
    else if (Array.isArray(data)) {
      const altStream = data.find(s => s.type === 'altitude');
      const timeStream = data.find(s => s.type === 'time');
      const distStream = data.find(s => s.type === 'distance');
      altitudeData = altStream?.data || altStream;
      timeData = timeStream?.data || timeStream;
      distanceData = distStream?.data || distStream;
    }

    if (altitudeData && timeData) {
      return { altitudeData, timeData, distanceData };
    }
    return null;
  }

  // Method 1: Fetch from internal Strava API (modern format with keys=)
  async function fetchStreamsFromInternalAPI(activityId) {
    try {
      // Modern Strava internal API format uses keys= parameter
      const streamUrl = `https://www.strava.com/activities/${activityId}/streams?keys=altitude,time,distance&key_by_type=true`;
      console.log('VAM Extension: Fetching from', streamUrl);

      const response = await fetch(streamUrl, { credentials: 'same-origin' });
      if (!response.ok) {
        console.log('VAM Extension: Internal API returned', response.status);
        return null;
      }

      const data = await response.json();
      console.log('VAM Extension: Internal API response type:', typeof data);
      return parseStreamResponse(data);
    } catch (e) {
      console.log('VAM Extension: Internal API fetch failed:', e.message);
      return null;
    }
  }

  // Method 2: Extract streams data from embedded page data
  async function extractStreamsFromPage(activityId) {
    try {
      // Check for pageView object (Strava's legacy frontend data)
      if (typeof window.pageView !== 'undefined' && window.pageView.activity) {
        const activity = window.pageView.activity();
        if (activity && activity.streams) {
          console.log('VAM Extension: Found data in pageView');
          return parseStreamResponse(activity.streams);
        }
      }

      // Check for __NEXT_DATA__ (if Strava migrated to Next.js)
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        const nextData = JSON.parse(nextDataScript.textContent);
        if (nextData.props?.pageProps?.activity?.streams) {
          console.log('VAM Extension: Found data in __NEXT_DATA__');
          return parseStreamResponse(nextData.props.pageProps.activity.streams);
        }
      }

      // Check for inline script data
      const scripts = document.querySelectorAll('script:not([src])');
      for (const script of scripts) {
        const text = script.textContent;
        if (text.includes('altitude') && text.includes('time') && text.includes(activityId)) {
          // Try to extract JSON data
          const jsonMatch = text.match(/\{[^{}]*"altitude"[^{}]*"time"[^{}]*\}/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[0]);
              const result = parseStreamResponse(data);
              if (result) {
                console.log('VAM Extension: Found data in inline script');
                return result;
              }
            } catch (e) {
              // Continue searching
            }
          }
        }
      }

      return null;
    } catch (e) {
      console.log('VAM Extension: Page extraction failed:', e.message);
      return null;
    }
  }

  // Method 3: Legacy API format (stream_types[] array format)
  async function fetchStreamsLegacy(activityId) {
    try {
      const streamUrl = `https://www.strava.com/activities/${activityId}/streams?stream_types[]=altitude&stream_types[]=time&stream_types[]=distance`;
      console.log('VAM Extension: Trying legacy format', streamUrl);

      const response = await fetch(streamUrl, { credentials: 'same-origin' });
      if (!response.ok) {
        console.log('VAM Extension: Legacy API returned', response.status);
        return null;
      }

      const data = await response.json();
      console.log('VAM Extension: Legacy API response type:', typeof data);
      return parseStreamResponse(data);
    } catch (e) {
      console.log('VAM Extension: Legacy API fetch failed:', e.message);
      return null;
    }
  }

  // Get activity data from Strava
  async function getActivityData() {
    try {
      const activityId = window.location.pathname.match(/\/activities\/(\d+)/)?.[1];
      if (!activityId) {
        console.log('VAM Extension: No activity ID found in URL');
        return null;
      }

      console.log('VAM Extension: Getting activity data for', activityId);

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
        console.log('VAM Extension: Using stored activity data for', activityId);
        return {
          activityId,
          elevation: storedActivity.streams.elevation,
          time: storedActivity.streams.time,
          distance: storedActivity.streams.distance,
          metadata: storedActivity.metadata
        };
      }

      // Try multiple methods to fetch activity data
      let streamData = null;

      // Method 1: Try the internal Strava streams endpoint (with keys format)
      streamData = await fetchStreamsFromInternalAPI(activityId);

      // Method 2: Try extracting from page data if internal API fails
      if (!streamData) {
        console.log('VAM Extension: Trying to extract from page data...');
        streamData = await extractStreamsFromPage(activityId);
      }

      // Method 3: Try legacy format as fallback
      if (!streamData) {
        console.log('VAM Extension: Trying legacy API format...');
        streamData = await fetchStreamsLegacy(activityId);
      }

      if (!streamData) {
        console.log('VAM Extension: Could not fetch activity streams');
        return null;
      }

      const { altitudeData, timeData, distanceData } = streamData;

      if (!altitudeData || !timeData) {
        console.log('VAM Extension: Missing required stream data (altitude or time)');
        return null;
      }

      // Extract activity metadata from the page
      const activityName = document.querySelector('.activity-name')?.textContent?.trim() ||
                          document.querySelector('h1.text-title1')?.textContent?.trim() ||
                          'Untitled Activity';
      const sportType = document.querySelector('[data-sport-type]')?.dataset?.sportType ||
                       document.querySelector('.activity-icon')?.className?.match(/icon-([a-z]+)/)?.[1] ||
                       'Ride';

      const activityData = {
        activityId,
        elevation: altitudeData,
        time: timeData,
        distance: distanceData || null,
        metadata: {
          name: activityName,
          sportType,
          date: new Date().toISOString()
        }
      };

      console.log('VAM Extension: Activity data loaded successfully', {
        elevationPoints: altitudeData.length,
        timePoints: timeData.length,
        distancePoints: distanceData ? distanceData.length : 0
      });

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

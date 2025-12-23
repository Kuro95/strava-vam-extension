// Background Service Worker - Handles bulk syncing and messages
// Firefox compatible version (Manifest V2)

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Listen for messages
browserAPI.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'openOptions') {
    if (browserAPI.runtime.openOptionsPage) {
      browserAPI.runtime.openOptionsPage();
    } else {
      window.open(browserAPI.runtime.getURL('options.html'));
    }
  } else if (request.action === 'syncAllActivities') {
    syncAllActivities(request.maxActivities || 100);
  }
  return true;
});

// Sync all activities from Strava
async function syncAllActivities(maxActivities = 100) {
  try {
    console.log('Starting bulk sync of activities...');

    // Get athlete's activities from Strava
    const activities = await fetchAthleteActivities(maxActivities);
    console.log(`Found ${activities.length} activities to process`);

    // Process each activity
    let processed = 0;
    let newPBs = 0;

    for (const activity of activities) {
      try {
        const result = await processActivity(activity);
        if (result.hasNewPB) {
          newPBs++;
        }
        processed++;

        // Send progress update
        browserAPI.runtime.sendMessage({
          action: 'syncProgress',
          processed,
          total: activities.length,
          newPBs
        });

        // Small delay to avoid rate limiting
        await sleep(200);
      } catch (error) {
        console.error(`Error processing activity ${activity.id}:`, error);
      }
    }

    // Send completion message
    browserAPI.runtime.sendMessage({
      action: 'syncComplete',
      processed,
      newPBs
    });

    console.log(`Sync complete: ${processed} activities processed, ${newPBs} new PBs`);
  } catch (error) {
    console.error('Error during bulk sync:', error);
    browserAPI.runtime.sendMessage({
      action: 'syncError',
      error: error.message
    });
  }
}

// Supported activity types for VAM calculation
const SUPPORTED_ACTIVITY_TYPES = [
  'Ride',
  'VirtualRide',
  'Run',
  'VirtualRun',
  'Hike',
  'Walk',
  'RockClimbing',
  'BackcountrySki',
  'AlpineSki',
  'NordicSki',
  'Snowshoe'
];

// Fetch athlete's activities with retry logic
async function fetchAthleteActivities(maxActivities) {
  const activities = [];
  const perPage = 30;
  let page = 1;
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 3;

  while (activities.length < maxActivities && consecutiveErrors < maxConsecutiveErrors) {
    try {
      const url = `https://www.strava.com/athlete/training_activities?new_activity_only=false&page=${page}&per_page=${perPage}`;

      let response;
      let lastError;

      // Retry logic with exponential backoff
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await fetch(url, {
            credentials: 'include',
            headers: {
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          if (response.ok) {break;}
          lastError = new Error(`HTTP ${response.status}`);
        } catch (fetchError) {
          lastError = fetchError;
          if (attempt < 2) {
            await sleep(1000 * (attempt + 1));
          }
        }
      }

      if (!response || !response.ok) {
        console.error('Failed to fetch activities page after retries:', lastError);
        consecutiveErrors++;
        continue;
      }

      consecutiveErrors = 0; // Reset on success

      const data = await response.json();

      if (!data.models || data.models.length === 0) {break;}

      // Filter for supported activity types with elevation
      const validActivities = data.models.filter(a =>
        SUPPORTED_ACTIVITY_TYPES.includes(a.type) && a.elevation_gain > 50
      );

      activities.push(...validActivities);

      if (data.models.length < perPage) {break;}
      page++;
    } catch (error) {
      console.error('Error fetching activities:', error);
      consecutiveErrors++;
    }
  }

  console.log(`Fetched ${activities.length} valid activities from ${page} pages`);
  return activities.slice(0, maxActivities);
}

// Process a single activity
async function processActivity(activity) {
  try {
    // Fetch stream data
    const streamData = await fetchActivityStreams(activity.id);
    if (!streamData) {return { hasNewPB: false };}

    // Load settings
    const settings = await loadSettings();

    // Calculate peaks for this activity
    const results = calculatePeaks(streamData, settings);

    // Update personal bests
    const pbUpdate = await updatePersonalBests(activity.id, results);

    // Save activity metadata for leaderboard
    if (pbUpdate.hasNewPB) {
      await saveActivityMetadata(activity.id, {
        name: activity.name || 'Untitled Activity',
        sportType: activity.type || 'Ride',
        date: activity.start_date || new Date().toISOString()
      });
    }

    return pbUpdate;
  } catch (error) {
    console.error(`Error processing activity ${activity.id}:`, error);
    return { hasNewPB: false };
  }
}

// Fetch activity stream data with retry logic
async function fetchActivityStreams(activityId, retries = 3) {
  const url = `https://www.strava.com/activities/${activityId}/streams?stream_types[]=altitude&stream_types[]=time&stream_types[]=distance`;

  let response;
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {break;}
      lastError = new Error(`HTTP ${response.status}`);
    } catch (fetchError) {
      lastError = fetchError;
      if (attempt < retries - 1) {
        await sleep(500 * (attempt + 1));
      }
    }
  }

  if (!response || !response.ok) {
    console.error(`Failed to fetch streams for activity ${activityId}:`, lastError);
    return null;
  }

  try {
    const data = await response.json();

    const altitudeData = data.altitude || data.find(s => s.type === 'altitude');
    const timeData = data.time || data.find(s => s.type === 'time');
    const distanceData = data.distance || data.find(s => s.type === 'distance');

    if (!altitudeData || !timeData) {
      console.log(`Activity ${activityId} has no altitude or time data`);
      return null;
    }

    return {
      elevation: altitudeData.data || altitudeData,
      time: timeData.data || timeData,
      distance: distanceData ? (distanceData.data || distanceData) : null
    };
  } catch (error) {
    console.error(`Error parsing streams for activity ${activityId}:`, error);
    return null;
  }
}

// Calculate VAM peaks (reusing logic from content script)
function calculatePeaks(streamData, settings) {
  const results = {};
  const configs = settings.customConfigs;

  // Time-based peaks
  if (settings.trackingModes.includes('time')) {
    results.time = {};
    configs.time.forEach(config => {
      results.time[config.label] = findBestVAMByTime(
        streamData.elevation,
        streamData.time,
        config.value
      );
    });
  }

  // Ascent-based peaks
  if (settings.trackingModes.includes('ascent')) {
    results.ascent = {};
    configs.ascent.forEach(config => {
      results.ascent[config.label] = findBestVAMByAscent(
        streamData.elevation,
        streamData.time,
        config.value
      );
    });
  }

  // Distance-based peaks
  if (settings.trackingModes.includes('distance') && streamData.distance) {
    results.distance = {};
    configs.distance.forEach(config => {
      results.distance[config.label] = findBestVAMByDistance(
        streamData.elevation,
        streamData.time,
        streamData.distance,
        config.value
      );
    });
  }

  return results;
}

// Helper functions (duplicated from content script)
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
              duration: Math.round(timeDiff)
            };
          }
        }
      }

      if (timeDiff > targetSeconds * (1 + tolerance)) {break;}
    }
  }

  return bestEffort || { vam: 0, elevationGain: 0, duration: targetSeconds };
}

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
              duration: Math.round(timeDiff)
            };
          }
        }
      }

      if (elevGain > targetAscent * (1 + tolerance)) {break;}
    }
  }

  return bestEffort || { vam: 0, elevationGain: 0, duration: 0 };
}

function findBestVAMByDistance(elevationStream, timeStream, distanceStream, targetDistance, tolerance = 0.1) {
  if (!distanceStream) {return { vam: 0, elevationGain: 0, duration: 0 };}

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
              distance: Math.round(distDiff)
            };
          }
        }
      }

      if (distDiff > targetDistance * (1 + tolerance)) {break;}
    }
  }

  return bestEffort || { vam: 0, elevationGain: 0, duration: 0 };
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

// Update personal bests
async function updatePersonalBests(activityId, currentResults) {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['vamPersonalBests'], (result) => {
      const allPBs = result.vamPersonalBests || {};
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
        browserAPI.storage.local.set({ vamPersonalBests: allPBs }, () => {
          resolve({ hasNewPB, newPBs, allPBs });
        });
      } else {
        resolve({ hasNewPB: false, newPBs: {}, allPBs });
      }
    });
  });
}

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Save activity metadata for leaderboard
async function saveActivityMetadata(activityId, metadata) {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['activityMetadata'], (result) => {
      const allMetadata = result.activityMetadata || {};
      allMetadata[activityId] = metadata;
      browserAPI.storage.local.set({ activityMetadata: allMetadata }, resolve);
    });
  });
}

console.log('VAM PB Tracker background script loaded');

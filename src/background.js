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

// Fetch athlete's activities
async function fetchAthleteActivities(maxActivities) {
  const activities = [];
  const perPage = 30;
  let page = 1;

  while (activities.length < maxActivities) {
    try {
      const url = `https://www.strava.com/athlete/training_activities?new_activity_only=false&page=${page}&per_page=${perPage}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {break;}

      const data = await response.json();

      if (!data.models || data.models.length === 0) {break;}

      // Filter for cycling activities with elevation
      const cyclingActivities = data.models.filter(a =>
        a.type === 'Ride' && a.elevation_gain > 50
      );

      activities.push(...cyclingActivities);

      if (data.models.length < perPage) {break;}
      page++;
    } catch (error) {
      console.error('Error fetching activities:', error);
      break;
    }
  }

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

// Fetch activity stream data
async function fetchActivityStreams(activityId) {
  try {
    const url = `https://www.strava.com/activities/${activityId}/streams?stream_types[]=altitude&stream_types[]=time&stream_types[]=distance`;
    const response = await fetch(url, {
      credentials: 'include'
    });

    if (!response.ok) {return null;}

    const data = await response.json();

    const altitudeData = data.altitude || data.find(s => s.type === 'altitude');
    const timeData = data.time || data.find(s => s.type === 'time');
    const distanceData = data.distance || data.find(s => s.type === 'distance');

    if (!altitudeData || !timeData) {return null;}

    return {
      elevation: altitudeData.data || altitudeData,
      time: timeData.data || timeData,
      distance: distanceData ? (distanceData.data || distanceData) : null
    };
  } catch (error) {
    console.error('Error fetching streams:', error);
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

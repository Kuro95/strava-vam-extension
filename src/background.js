// Background Service Worker - Handles bulk syncing and messages
// Firefox compatible version (Manifest V2)
// Uses shared storage and VAM calculator modules

// Browser API compatibility
const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;

// Import shared modules (they attach to global scope)
// In Manifest V2, these are loaded via manifest.json background scripts array

// Listen for messages
browserAPI.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'openOptions') {
    if (browserAPI.runtime.openOptionsPage) {
      browserAPI.runtime.openOptionsPage();
    } else {
      window.open(browserAPI.runtime.getURL('options.html'));
    }
  } else if (request.action === 'syncAllActivities') {
    syncAllActivities(request.maxActivities || 100);
  } else if (request.action === 'reprocessAllActivities') {
    reprocessAllActivities();
  } else if (request.action === 'getStorageStats') {
    ActivityStorage.getStorageStats().then(stats => {
      sendResponse(stats);
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'exportActivities') {
    ActivityStorage.exportActivities().then(data => {
      sendResponse({ data });
    });
    return true;
  } else if (request.action === 'clearAllData') {
    clearAllData().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  return true;
});

// Clear all stored data
async function clearAllData() {
  await ActivityStorage.clearAllActivities();
  await new Promise(resolve => {
    browserAPI.storage.local.clear(resolve);
  });
}

// Sync all activities from Strava
async function syncAllActivities(maxActivities = 100) {
  try {
    console.log('Starting bulk sync of activities...');

    // Send initial status
    browserAPI.runtime.sendMessage({
      action: 'syncProgress',
      status: 'fetching',
      message: 'Fetching activity list from Strava...'
    });

    // Get athlete's activities from Strava
    const activities = await fetchAthleteActivities(maxActivities);
    console.log(`Found ${activities.length} activities to process`);

    // Process each activity
    let processed = 0;
    let newPBs = 0;
    let stored = 0;

    for (const activity of activities) {
      try {
        // Check if we already have this activity stored
        const existingActivity = await ActivityStorage.getActivity(String(activity.id));

        let streamData;
        if (existingActivity && existingActivity.streams) {
          // Use cached stream data
          streamData = existingActivity.streams;
        } else {
          // Fetch stream data from Strava
          streamData = await fetchActivityStreams(activity.id);

          if (streamData) {
            // Store raw activity data
            await ActivityStorage.saveActivity({
              activityId: String(activity.id),
              streams: streamData,
              metadata: {
                name: activity.name || 'Untitled Activity',
                sportType: activity.type || 'Ride',
                date: activity.start_date || new Date().toISOString(),
                totalElevation: activity.elevation_gain,
                totalDistance: activity.distance,
                movingTime: activity.moving_time
              }
            });
            stored++;
          }
        }

        if (streamData) {
          // Load settings and process
          const settings = await loadSettings();
          const results = VAMCalculator.processActivity(streamData, settings);

          // Cache computed results
          const settingsHash = ActivityStorage.createSettingsHash(settings);
          await ActivityStorage.saveComputedResults(String(activity.id), results, settingsHash);

          // Update personal bests
          const pbUpdate = await updatePersonalBests(String(activity.id), results);
          if (pbUpdate.hasNewPB) {
            newPBs++;
            // Save activity metadata for leaderboard
            await saveActivityMetadata(String(activity.id), {
              name: activity.name || 'Untitled Activity',
              sportType: activity.type || 'Ride',
              date: activity.start_date || new Date().toISOString()
            });
          }
        }

        processed++;

        // Send progress update
        browserAPI.runtime.sendMessage({
          action: 'syncProgress',
          processed,
          total: activities.length,
          newPBs,
          stored
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
      newPBs,
      stored
    });

    console.log(`Sync complete: ${processed} activities processed, ${stored} stored, ${newPBs} new PBs`);
  } catch (error) {
    console.error('Error during bulk sync:', error);
    browserAPI.runtime.sendMessage({
      action: 'syncError',
      error: error.message
    });
  }
}

// Reprocess all stored activities with current settings
async function reprocessAllActivities() {
  try {
    console.log('Starting reprocessing of all stored activities...');

    const activities = await ActivityStorage.getAllActivities();
    const settings = await loadSettings();
    const settingsHash = ActivityStorage.createSettingsHash(settings);

    let processed = 0;
    let newPBs = 0;

    // Clear existing PBs to recalculate from scratch
    await new Promise(resolve => {
      browserAPI.storage.local.remove(['vamPersonalBests'], resolve);
    });

    for (const activity of activities) {
      try {
        if (!activity.streams) {continue;}

        // Recalculate VAM with current settings
        const results = VAMCalculator.processActivity(activity.streams, settings);

        // Cache new computed results
        await ActivityStorage.saveComputedResults(activity.activityId, results, settingsHash);

        // Update personal bests
        const pbUpdate = await updatePersonalBests(activity.activityId, results);
        if (pbUpdate.hasNewPB) {
          newPBs++;
        }

        processed++;

        // Send progress update
        browserAPI.runtime.sendMessage({
          action: 'reprocessProgress',
          processed,
          total: activities.length,
          newPBs
        });
      } catch (error) {
        console.error(`Error reprocessing activity ${activity.activityId}:`, error);
      }
    }

    // Send completion message
    browserAPI.runtime.sendMessage({
      action: 'reprocessComplete',
      processed,
      newPBs
    });

    console.log(`Reprocessing complete: ${processed} activities, ${newPBs} PBs found`);
  } catch (error) {
    console.error('Error during reprocessing:', error);
    browserAPI.runtime.sendMessage({
      action: 'reprocessError',
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
        (a.type === 'Ride' || a.type === 'VirtualRide') && a.elevation_gain > 50
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

// Load settings
async function loadSettings() {
  return new Promise((resolve) => {
    browserAPI.storage.local.get(['vamSettings'], (result) => {
      const defaults = {
        trackingModes: ['time', 'ascent', 'distance'],
        customConfigs: VAMCalculator.DEFAULT_CONFIGS
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

console.log('VAM PB Tracker background script loaded (with IndexedDB storage)');

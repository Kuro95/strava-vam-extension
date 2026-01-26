// IndexedDB Storage Module for Strava VAM Extension
// Stores raw activity data for local reprocessing

(function (global) {
  'use strict';

  const DB_NAME = 'StravaVAMExtension';
  const DB_VERSION = 1;
  const ACTIVITIES_STORE = 'activities';
  const COMPUTED_STORE = 'computedResults';

  let db = null;

  // Initialize IndexedDB
  async function initDB() {
    if (db) {return db;}

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Activities store - holds raw stream data
        if (!database.objectStoreNames.contains(ACTIVITIES_STORE)) {
          const activitiesStore = database.createObjectStore(ACTIVITIES_STORE, { keyPath: 'activityId' });
          activitiesStore.createIndex('date', 'metadata.date', { unique: false });
          activitiesStore.createIndex('sportType', 'metadata.sportType', { unique: false });
          activitiesStore.createIndex('syncedAt', 'syncedAt', { unique: false });
        }

        // Computed results store - cached VAM calculations
        if (!database.objectStoreNames.contains(COMPUTED_STORE)) {
          const computedStore = database.createObjectStore(COMPUTED_STORE, { keyPath: 'activityId' });
          computedStore.createIndex('computedAt', 'computedAt', { unique: false });
        }
      };
    });
  }

  // Save a single activity with raw stream data
  async function saveActivity(activityData) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE], 'readwrite');
      const store = transaction.objectStore(ACTIVITIES_STORE);

      const record = {
        activityId: activityData.activityId,
        streams: {
          elevation: activityData.elevation || activityData.streams?.elevation,
          time: activityData.time || activityData.streams?.time,
          distance: activityData.distance || activityData.streams?.distance
        },
        metadata: activityData.metadata || {
          name: 'Unknown Activity',
          sportType: 'Ride',
          date: new Date().toISOString()
        },
        syncedAt: new Date().toISOString()
      };

      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  // Get a single activity by ID
  async function getActivity(activityId) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE], 'readonly');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const request = store.get(activityId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all activities
  async function getAllActivities() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE], 'readonly');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Get activities by sport type
  async function getActivitiesBySport(sportType) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE], 'readonly');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const index = store.index('sportType');
      const request = index.getAll(sportType);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Get activity count
  async function getActivityCount() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE], 'readonly');
      const store = transaction.objectStore(ACTIVITIES_STORE);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete a single activity
  async function deleteActivity(activityId) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE, COMPUTED_STORE], 'readwrite');

      // Delete from both stores
      transaction.objectStore(ACTIVITIES_STORE).delete(activityId);
      transaction.objectStore(COMPUTED_STORE).delete(activityId);

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Clear all activities
  async function clearAllActivities() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([ACTIVITIES_STORE, COMPUTED_STORE], 'readwrite');

      transaction.objectStore(ACTIVITIES_STORE).clear();
      transaction.objectStore(COMPUTED_STORE).clear();

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Save computed results for an activity
  async function saveComputedResults(activityId, results, settingsHash) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([COMPUTED_STORE], 'readwrite');
      const store = transaction.objectStore(COMPUTED_STORE);

      const record = {
        activityId,
        results,
        settingsHash,
        computedAt: new Date().toISOString()
      };

      const request = store.put(record);

      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }

  // Get computed results for an activity
  async function getComputedResults(activityId) {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([COMPUTED_STORE], 'readonly');
      const store = transaction.objectStore(COMPUTED_STORE);
      const request = store.get(activityId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all computed results
  async function getAllComputedResults() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([COMPUTED_STORE], 'readonly');
      const store = transaction.objectStore(COMPUTED_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all computed results (used when settings change)
  async function clearComputedResults() {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([COMPUTED_STORE], 'readwrite');
      const store = transaction.objectStore(COMPUTED_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Check if activity exists
  async function hasActivity(activityId) {
    const activity = await getActivity(activityId);
    return activity !== null;
  }

  // Get storage statistics
  async function getStorageStats() {
    const activities = await getAllActivities();
    const computed = await getAllComputedResults();

    let totalStreamSize = 0;
    activities.forEach(activity => {
      if (activity.streams) {
        if (activity.streams.elevation) {totalStreamSize += activity.streams.elevation.length * 8;}
        if (activity.streams.time) {totalStreamSize += activity.streams.time.length * 8;}
        if (activity.streams.distance) {totalStreamSize += activity.streams.distance.length * 8;}
      }
    });

    return {
      activityCount: activities.length,
      computedCount: computed.length,
      estimatedSizeBytes: totalStreamSize,
      estimatedSizeMB: (totalStreamSize / (1024 * 1024)).toFixed(2)
    };
  }

  // Export activities to JSON (for backup)
  async function exportActivities() {
    const activities = await getAllActivities();
    return JSON.stringify(activities, null, 2);
  }

  // Import activities from JSON (for restore)
  async function importActivities(jsonData) {
    const activities = JSON.parse(jsonData);
    let imported = 0;

    for (const activity of activities) {
      await saveActivity(activity);
      imported++;
    }

    return imported;
  }

  // Create a hash of settings for cache invalidation
  function createSettingsHash(settings) {
    const str = JSON.stringify(settings.customConfigs) + settings.trackingModes.join(',');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // Public API
  const ActivityStorage = {
    initDB,
    saveActivity,
    getActivity,
    getAllActivities,
    getActivitiesBySport,
    getActivityCount,
    deleteActivity,
    clearAllActivities,
    saveComputedResults,
    getComputedResults,
    getAllComputedResults,
    clearComputedResults,
    hasActivity,
    getStorageStats,
    exportActivities,
    importActivities,
    createSettingsHash
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityStorage;
  } else {
    global.ActivityStorage = ActivityStorage;
  }

})(typeof window !== 'undefined' ? window : this);

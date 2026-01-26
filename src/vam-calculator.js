// Shared VAM Calculator Module
// Single source of truth for all VAM calculations

(function (global) {
  'use strict';

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

  // Process activity and find all peaks based on settings
  function processActivity(streams, settings) {
    const results = {};
    const configs = settings.customConfigs || DEFAULT_CONFIGS;

    const elevation = streams.elevation;
    const time = streams.time;
    const distance = streams.distance;

    if (!elevation || !time) {
      return results;
    }

    // Process each tracking mode
    if (settings.trackingModes.includes('time')) {
      results.time = {};
      configs.time.forEach(config => {
        results.time[config.label] = findBestVAMByTime(elevation, time, config.value);
      });
    }

    if (settings.trackingModes.includes('ascent')) {
      results.ascent = {};
      configs.ascent.forEach(config => {
        results.ascent[config.label] = findBestVAMByAscent(elevation, time, config.value);
      });
    }

    if (settings.trackingModes.includes('distance') && distance) {
      results.distance = {};
      configs.distance.forEach(config => {
        results.distance[config.label] = findBestVAMByDistance(elevation, time, distance, config.value);
      });
    }

    return results;
  }

  // Calculate total elevation gain for an activity
  function calculateTotalElevationGain(elevationStream) {
    if (!elevationStream || elevationStream.length < 2) {return 0;}

    const smoothed = smoothElevationData(elevationStream, 3);
    return calculateCumulativeElevationGain(smoothed, 0, smoothed.length - 1);
  }

  // Calculate average gradient for a segment
  function calculateGradient(elevationStream, distanceStream, startIdx, endIdx) {
    if (!distanceStream) {return 0;}

    const elevGain = elevationStream[endIdx] - elevationStream[startIdx];
    const distance = distanceStream[endIdx] - distanceStream[startIdx];

    if (distance === 0) {return 0;}
    return (elevGain / distance) * 100; // Return as percentage
  }

  // Find the best overall VAM from results (for quick comparisons)
  function getBestVAMFromResults(results) {
    let bestVAM = 0;
    let bestMetric = null;

    Object.keys(results).forEach(mode => {
      Object.keys(results[mode]).forEach(label => {
        const effort = results[mode][label];
        if (effort.vam > bestVAM) {
          bestVAM = effort.vam;
          bestMetric = { mode, label, ...effort };
        }
      });
    });

    return bestMetric;
  }

  // Format duration for display
  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    if (mins > 0) {
      return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}m`;
    }
    return `${secs}s`;
  }

  // Public API
  const VAMCalculator = {
    DEFAULT_CONFIGS,
    calculateVAM,
    calculateCumulativeElevationGain,
    smoothElevationData,
    findBestVAMByTime,
    findBestVAMByAscent,
    findBestVAMByDistance,
    processActivity,
    calculateTotalElevationGain,
    calculateGradient,
    getBestVAMFromResults,
    formatDuration
  };

  // Export for different module systems
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VAMCalculator;
  } else {
    global.VAMCalculator = VAMCalculator;
  }

})(typeof window !== 'undefined' ? window : this);

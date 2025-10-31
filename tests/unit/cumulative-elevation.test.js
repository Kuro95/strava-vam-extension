/**
 * Unit tests for cumulative elevation gain calculation
 * This tests the critical fix for VAM calculation
 */

// Helper function to calculate cumulative elevation gain
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

// Helper function to smooth elevation data
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

describe('Cumulative Elevation Gain Tests', () => {
  describe('calculateCumulativeElevationGain', () => {
    test('should calculate cumulative gain for simple climb', () => {
      const elevation = [100, 110, 120, 130, 140, 150];
      const result = calculateCumulativeElevationGain(elevation, 0, 5);

      // Each segment gains 10m, total = 50m
      expect(result).toBe(50);
    });

    test('should handle climb with small descent', () => {
      const elevation = [100, 110, 120, 130, 125, 135, 145];
      const result = calculateCumulativeElevationGain(elevation, 0, 6);

      // Gains: 10 + 10 + 10 + 0 (descent ignored) + 10 + 10 = 50m
      expect(result).toBe(50);
    });

    test('should ignore descents in cumulative calculation', () => {
      const elevation = [100, 110, 105, 115, 110, 120];
      const result = calculateCumulativeElevationGain(elevation, 0, 5);

      // Net gain: 120 - 100 = 20m
      // Cumulative gain: 10 + 0 (descent) + 10 + 0 (descent) + 10 = 30m
      expect(result).toBe(30);

      // Compare with net gain (old method)
      const netGain = elevation[5] - elevation[0];
      expect(netGain).toBe(20);
      expect(result).toBeGreaterThan(netGain);
    });

    test('should return 0 for flat segment', () => {
      const elevation = [100, 100, 100, 100, 100];
      const result = calculateCumulativeElevationGain(elevation, 0, 4);

      expect(result).toBe(0);
    });

    test('should return 0 for pure descent', () => {
      const elevation = [150, 140, 130, 120, 110, 100];
      const result = calculateCumulativeElevationGain(elevation, 0, 5);

      expect(result).toBe(0);
    });

    test('should handle mixed terrain correctly', () => {
      // Realistic scenario: climb with ups and downs
      const elevation = [100, 120, 115, 125, 130, 125, 140, 150];
      const result = calculateCumulativeElevationGain(elevation, 0, 7);

      // Positive changes: 20 + 0 + 10 + 5 + 0 + 15 + 10 = 60m
      expect(result).toBe(60);

      // Compare with net gain
      const netGain = elevation[7] - elevation[0];
      expect(netGain).toBe(50);
      expect(result).toBe(60); // 20% more than net gain
    });

    test('should handle subsegment correctly', () => {
      const elevation = [100, 110, 120, 130, 140, 150, 160];
      const result = calculateCumulativeElevationGain(elevation, 2, 5);

      // From index 2 to 5: 120 -> 130 -> 140 -> 150
      // Gains: 10 + 10 + 10 = 30m
      expect(result).toBe(30);
    });
  });

  describe('smoothElevationData', () => {
    test('should smooth noisy elevation data', () => {
      const elevation = [100, 105, 102, 107, 104, 110];
      const smoothed = smoothElevationData(elevation, 3);

      expect(smoothed.length).toBe(elevation.length);
      // First element should be average of [100, 105, 102]
      expect(smoothed[0]).toBeCloseTo((100 + 105) / 2, 1);
      // Middle elements should be smoother
      expect(smoothed[2]).toBeCloseTo((105 + 102 + 107) / 3, 1);
    });

    test('should handle small arrays', () => {
      const elevation = [100, 110];
      const smoothed = smoothElevationData(elevation, 3);

      expect(smoothed).toEqual(elevation);
    });

    test('should reduce noise amplitude', () => {
      const noisy = [100, 110, 105, 115, 110, 120, 115, 125];
      const smoothed = smoothElevationData(noisy, 3);

      // Calculate variance of changes
      const noisyChanges = [];
      const smoothedChanges = [];

      for (let i = 1; i < noisy.length; i++) {
        noisyChanges.push(Math.abs(noisy[i] - noisy[i - 1]));
        smoothedChanges.push(Math.abs(smoothed[i] - smoothed[i - 1]));
      }

      const avgNoisyChange = noisyChanges.reduce((a, b) => a + b, 0) / noisyChanges.length;
      const avgSmoothedChange = smoothedChanges.reduce((a, b) => a + b, 0) / smoothedChanges.length;

      // Smoothed should have similar or lower average change magnitude
      expect(avgSmoothedChange).toBeLessThanOrEqual(avgNoisyChange * 1.1);
    });

    test('should preserve overall trend', () => {
      const elevation = [100, 110, 105, 115, 110, 120, 115, 125, 120, 130];
      const smoothed = smoothElevationData(elevation, 3);

      // Overall trend should be upward (last > first)
      expect(smoothed[smoothed.length - 1]).toBeGreaterThan(smoothed[0]);
      // Smoothing should keep values in reasonable range
      const min = Math.min(...elevation);
      const max = Math.max(...elevation);
      smoothed.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(min - 5);
        expect(val).toBeLessThanOrEqual(max + 5);
      });
    });
  });

  describe('VAM Calculation Impact', () => {
    test('cumulative method gives higher VAM for terrain with descents', () => {
      function calculateVAM(elevationGain, timeSeconds) {
        if (timeSeconds === 0) {return 0;}
        return (elevationGain / (timeSeconds / 3600));
      }

      const elevation = [100, 120, 115, 130, 125, 140];
      const timeSeconds = 300; // 5 minutes

      // Old method (net gain)
      const netGain = elevation[elevation.length - 1] - elevation[0];
      const netVAM = calculateVAM(netGain, timeSeconds);

      // New method (cumulative gain)
      const cumulativeGain = calculateCumulativeElevationGain(elevation, 0, elevation.length - 1);
      const cumulativeVAM = calculateVAM(cumulativeGain, timeSeconds);

      expect(netGain).toBe(40); // 140 - 100
      expect(cumulativeGain).toBe(50); // 20 + 15 + 15
      expect(cumulativeVAM).toBeGreaterThan(netVAM);
      expect(cumulativeVAM).toBe(600); // 50m / (300s/3600) = 600 m/h
    });

    test('cumulative and net methods equal for pure climb', () => {
      function calculateVAM(elevationGain, timeSeconds) {
        if (timeSeconds === 0) {return 0;}
        return (elevationGain / (timeSeconds / 3600));
      }

      const elevation = [100, 110, 120, 130, 140, 150];
      const timeSeconds = 300;

      const netGain = elevation[elevation.length - 1] - elevation[0];
      const cumulativeGain = calculateCumulativeElevationGain(elevation, 0, elevation.length - 1);

      expect(netGain).toBe(50);
      expect(cumulativeGain).toBe(50);
      expect(calculateVAM(netGain, timeSeconds)).toBe(calculateVAM(cumulativeGain, timeSeconds));
    });

    test('realistic climb scenario shows significant difference', () => {
      function calculateVAM(elevationGain, timeSeconds) {
        if (timeSeconds === 0) {return 0;}
        return (elevationGain / (timeSeconds / 3600));
      }

      // Realistic 20-minute climb with switchbacks and small descents
      const elevation = [
        100, 115, 110, 125, 120, 135, 130, 145, 140, 155,
        150, 165, 160, 175, 170, 185, 180, 195, 190, 205, 200
      ];
      const timeSeconds = 1200; // 20 minutes

      const netGain = elevation[elevation.length - 1] - elevation[0];
      const cumulativeGain = calculateCumulativeElevationGain(elevation, 0, elevation.length - 1);

      expect(netGain).toBe(100); // 200 - 100
      expect(cumulativeGain).toBe(150); // Much higher with cumulative

      const netVAM = calculateVAM(netGain, timeSeconds);
      const cumulativeVAM = calculateVAM(cumulativeGain, timeSeconds);

      expect(netVAM).toBe(300); // 100m / (1200s/3600)
      expect(cumulativeVAM).toBe(450); // 150m / (1200s/3600)
      expect(cumulativeVAM / netVAM).toBe(1.5); // 50% higher!
    });
  });
});

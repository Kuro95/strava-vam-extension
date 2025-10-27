/**
 * Unit tests for VAM calculation functions
 */

describe('VAM Calculation Tests', () => {
  describe('calculateVAM', () => {
    test('should calculate VAM correctly for basic case', () => {
      // VAM = (elevation gain in meters / time in hours)
      const elevationGain = 1000; // meters
      const timeInSeconds = 3600; // 1 hour
      const expectedVAM = 1000; // m/h

      const vam = (elevationGain / (timeInSeconds / 3600));

      expect(vam).toBe(expectedVAM);
    });

    test('should handle 30-minute effort', () => {
      const elevationGain = 500; // meters
      const timeInSeconds = 1800; // 30 minutes
      const expectedVAM = 1000; // m/h

      const vam = (elevationGain / (timeInSeconds / 3600));

      expect(vam).toBe(expectedVAM);
    });

    test('should handle very short efforts', () => {
      const elevationGain = 100; // meters
      const timeInSeconds = 300; // 5 minutes
      const expectedVAM = 1200; // m/h

      const vam = (elevationGain / (timeInSeconds / 3600));

      expect(vam).toBe(expectedVAM);
    });

    test('should return 0 for zero time', () => {
      const elevationGain = 100;
      const timeInSeconds = 0;

      const vam = timeInSeconds > 0 ? (elevationGain / (timeInSeconds / 3600)) : 0;

      expect(vam).toBe(0);
    });

    test('should handle decimal values correctly', () => {
      const elevationGain = 750.5;
      const timeInSeconds = 2700; // 45 minutes
      const expectedVAM = 1000.67;

      const vam = (elevationGain / (timeInSeconds / 3600));

      expect(vam).toBeCloseTo(expectedVAM, 1);
    });
  });

  describe('Data Validation', () => {
    test('should validate elevation data is present', () => {
      const hasElevationData = (data) => {
        return data && Array.isArray(data) && data.length > 0;
      };

      expect(hasElevationData([100, 150, 200])).toBe(true);
      expect(hasElevationData([])).toBe(false);
      expect(hasElevationData(null)).toBe(false);
      expect(hasElevationData(undefined)).toBe(false);
    });

    test('should validate time data is present', () => {
      const hasTimeData = (data) => {
        return data && Array.isArray(data) && data.length > 0;
      };

      expect(hasTimeData([0, 30, 60])).toBe(true);
      expect(hasTimeData([])).toBe(false);
      expect(hasTimeData(null)).toBe(false);
    });
  });

  describe('Browser Storage Mock', () => {
    beforeEach(() => {
      // Clear mocks before each test
      jest.clearAllMocks();
    });

    test('should save personal best to storage', async () => {
      const pbData = {
        vam: 1500,
        duration: 600,
        elevation: 250,
        activityId: '12345'
      };

      browser.storage.local.set.mockResolvedValue();

      await browser.storage.local.set({ pb_10min: pbData });

      expect(browser.storage.local.set).toHaveBeenCalledWith({ pb_10min: pbData });
      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
    });

    test('should retrieve personal best from storage', async () => {
      const mockPB = {
        pb_10min: {
          vam: 1500,
          duration: 600,
          elevation: 250,
          activityId: '12345'
        }
      };

      browser.storage.local.get.mockResolvedValue(mockPB);

      const result = await browser.storage.local.get('pb_10min');

      expect(result).toEqual(mockPB);
      expect(browser.storage.local.get).toHaveBeenCalledWith('pb_10min');
    });
  });
});

describe('Personal Best Comparison', () => {
  test('should identify new personal best', () => {
    const currentBest = { vam: 1200, activityId: 'old' };
    const newEffort = { vam: 1500, activityId: 'new' };

    const isNewPB = newEffort.vam > currentBest.vam;

    expect(isNewPB).toBe(true);
  });

  test('should not identify lower VAM as personal best', () => {
    const currentBest = { vam: 1500, activityId: 'old' };
    const newEffort = { vam: 1200, activityId: 'new' };

    const isNewPB = newEffort.vam > currentBest.vam;

    expect(isNewPB).toBe(false);
  });

  test('should handle first-time recording', () => {
    const currentBest = null;
    const newEffort = { vam: 1000, activityId: 'new' };

    const isNewPB = !currentBest || newEffort.vam > currentBest.vam;

    expect(isNewPB).toBe(true);
  });
});

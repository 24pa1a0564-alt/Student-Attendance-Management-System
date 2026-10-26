const {
  calculateAttendanceMetrics,
  calculateRequiredClasses,
} = require('../utils/attendanceCalculator');

describe('Attendance Calculation Logic', () => {
  describe('calculateAttendanceMetrics', () => {
    test('calculates correct percentage with CountAsAbsent leave policy', () => {
      // 40 present, 10 absent, 0 leave -> 40/50 = 80%
      const result = calculateAttendanceMetrics(40, 10, 0, 'CountAsAbsent');
      expect(result.classesAttended).toBe(40);
      expect(result.totalClassesHeld).toBe(50);
      expect(result.percentage).toBe(80);
    });

    test('handles zero classes held without dividing by zero', () => {
      const result = calculateAttendanceMetrics(0, 0, 0, 'CountAsAbsent');
      expect(result.classesAttended).toBe(0);
      expect(result.totalClassesHeld).toBe(0);
      expect(result.percentage).toBe(0);
    });

    test('respects ExemptFromTotal leave policy', () => {
      // 40 present, 10 absent, 5 leave -> total 50 held, 40 attended -> 80%
      const result = calculateAttendanceMetrics(40, 10, 5, 'ExemptFromTotal');
      expect(result.totalClassesHeld).toBe(50);
      expect(result.classesAttended).toBe(40);
      expect(result.percentage).toBe(80);
    });

    test('respects CountAsPresent leave policy', () => {
      // 40 present, 5 absent, 5 leave -> total 50 held, 45 attended -> 90%
      const result = calculateAttendanceMetrics(40, 5, 5, 'CountAsPresent');
      expect(result.totalClassesHeld).toBe(50);
      expect(result.classesAttended).toBe(45);
      expect(result.percentage).toBe(90);
    });
  });

  describe('calculateRequiredClasses (Attendance Target Calculator)', () => {
    test('calculates correct required classes for standard example (40 attended, 50 held, 85% target)', () => {
      // Formula: Ceiling((0.85 * 50 - 40) / (1 - 0.85))
      // Numerator: 42.5 - 40 = 2.5
      // Denominator: 0.15
      // 2.5 / 0.15 = 16.666... -> Ceiling = 17
      const result = calculateRequiredClasses(40, 50, 85);
      expect(result.isValid).toBe(true);
      expect(result.currentPercentage).toBe(80);
      expect(result.targetPercentage).toBe(85);
      expect(result.requiredClasses).toBe(17);
      expect(result.isPossible).toBe(true);

      // Verify projected percentage: (40 + 17) / (50 + 17) = 57 / 67 = 85.07% >= 85%
      expect(result.projectedPercentage).toBeGreaterThanOrEqual(85);
    });

    test('returns 0 required classes if target is already reached or exceeded', () => {
      const result = calculateRequiredClasses(45, 50, 85); // 90% current vs 85% target
      expect(result.isValid).toBe(true);
      expect(result.currentPercentage).toBe(90);
      expect(result.requiredClasses).toBe(0);
      expect(result.message).toContain('Target achieved');
    });

    test('handles 100% target when classes have already been missed', () => {
      const result = calculateRequiredClasses(40, 50, 100);
      expect(result.isValid).toBe(true);
      expect(result.isPossible).toBe(false);
      expect(result.requiredClasses).toBe(-1);
      expect(result.message).toContain('mathematically unreachable');
    });

    test('handles 100% target when 0 classes have been missed', () => {
      const result = calculateRequiredClasses(50, 50, 100);
      expect(result.isValid).toBe(true);
      expect(result.isPossible).toBe(true);
      expect(result.requiredClasses).toBe(0);
    });

    test('handles student with 0 classes recorded', () => {
      const result = calculateRequiredClasses(0, 0, 75);
      expect(result.isValid).toBe(true);
      expect(result.requiredClasses).toBe(1);
      expect(result.projectedPercentage).toBe(100);
    });

    test('rejects invalid target percentages', () => {
      const negativeResult = calculateRequiredClasses(10, 20, -5);
      expect(negativeResult.isValid).toBe(false);

      const excessResult = calculateRequiredClasses(10, 20, 105);
      expect(excessResult.isValid).toBe(false);

      const nanResult = calculateRequiredClasses(10, 20, 'abc');
      expect(nanResult.isValid).toBe(false);
    });
  });
});

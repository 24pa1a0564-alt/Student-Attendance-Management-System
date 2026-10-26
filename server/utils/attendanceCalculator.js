/**
 * Attendance Calculation Utility
 * Provides standard institutional formulas for attendance statistics and future target calculations.
 */

/**
 * Calculate attendance metrics from counts of Present, Absent, and On Leave
 * @param {number} presentCount
 * @param {number} absentCount
 * @param {number} leaveCount
 * @param {string} leavePolicy - 'CountAsAbsent' | 'ExemptFromTotal' | 'CountAsPresent'
 * @returns {object} { totalClassesHeld, classesAttended, percentage }
 */
function calculateAttendanceMetrics(
  presentCount = 0,
  absentCount = 0,
  leaveCount = 0,
  leavePolicy = 'CountAsAbsent'
) {
  let attended = presentCount;
  let totalHeld = presentCount + absentCount + leaveCount;

  if (leavePolicy === 'ExemptFromTotal') {
    totalHeld = presentCount + absentCount;
  } else if (leavePolicy === 'CountAsPresent') {
    attended = presentCount + leaveCount;
  }

  const percentage = totalHeld === 0 ? 0 : Number(((attended / totalHeld) * 100).toFixed(2));

  return {
    classesAttended: attended,
    classesAbsent: absentCount,
    classesOnLeave: leaveCount,
    totalClassesHeld: totalHeld,
    percentage,
  };
}

/**
 * Attendance Target Calculator
 * Formula: Required Classes = Ceiling((Target Percentage * Total Classes Held - Classes Attended) / (1 - Target Percentage))
 * 
 * @param {number} classesAttended
 * @param {number} totalClassesHeld
 * @param {number} targetPercentageInput - E.g. 85 or 0.85
 * @returns {object} Detailed calculation result and projection
 */
function calculateRequiredClasses(classesAttended, totalClassesHeld, targetPercentageInput) {
  // Normalize target percentage to 0 - 100 and decimal 0.0 - 1.0
  let targetPercent = Number(targetPercentageInput);
  if (isNaN(targetPercent) || targetPercent <= 0 || targetPercent > 100) {
    return {
      isValid: false,
      message: 'Target percentage must be a valid number between 1 and 100.',
    };
  }

  const attended = Math.max(0, Number(classesAttended) || 0);
  const total = Math.max(0, Number(totalClassesHeld) || 0);

  // If attended > total, correct total
  const effectiveTotal = Math.max(attended, total);
  const currentPercentage =
    effectiveTotal === 0 ? 0 : Number(((attended / effectiveTotal) * 100).toFixed(2));

  // Case 1: Student has 0 recorded classes held
  if (effectiveTotal === 0) {
    return {
      isValid: true,
      currentPercentage: 0,
      targetPercentage: targetPercent,
      classesAttended: 0,
      totalClassesHeld: 0,
      requiredClasses: 1,
      projectedPercentage: 100,
      isPossible: true,
      message: 'No classes have been recorded yet. Attending the upcoming class will yield 100% attendance.',
    };
  }

  // Case 2: Target already achieved
  if (currentPercentage >= targetPercent) {
    return {
      isValid: true,
      currentPercentage,
      targetPercentage: targetPercent,
      classesAttended: attended,
      totalClassesHeld: effectiveTotal,
      requiredClasses: 0,
      projectedPercentage: currentPercentage,
      isPossible: true,
      message: `Target achieved! Your current attendance (${currentPercentage}%) already meets or exceeds your target of ${targetPercent}%.`,
    };
  }

  const targetDecimal = targetPercent / 100;

  // Case 3: Target is 100%
  if (targetPercent === 100) {
    const missedClasses = effectiveTotal - attended;
    if (missedClasses > 0) {
      return {
        isValid: true,
        currentPercentage,
        targetPercentage: 100,
        classesAttended: attended,
        totalClassesHeld: effectiveTotal,
        requiredClasses: -1,
        projectedPercentage: currentPercentage,
        isPossible: false,
        message: `A 100% attendance rate is mathematically unreachable because ${missedClasses} class(es) have already been missed.`,
      };
    } else {
      return {
        isValid: true,
        currentPercentage: 100,
        targetPercentage: 100,
        classesAttended: attended,
        totalClassesHeld: effectiveTotal,
        requiredClasses: 0,
        projectedPercentage: 100,
        isPossible: true,
        message: 'You have attended all classes held so far (100%).',
      };
    }
  }

  // Standard Formula:
  // (attended + X) / (total + X) >= targetDecimal
  // attended + X >= targetDecimal * total + targetDecimal * X
  // X * (1 - targetDecimal) >= targetDecimal * total - attended
  // X >= (targetDecimal * total - attended) / (1 - targetDecimal)
  const numerator = targetDecimal * effectiveTotal - attended;
  const denominator = 1 - targetDecimal;
  const required = Math.ceil(numerator / denominator);
  const requiredClasses = Math.max(0, required);

  const projectedTotal = effectiveTotal + requiredClasses;
  const projectedAttended = attended + requiredClasses;
  const projectedPercentage = Number(((projectedAttended / projectedTotal) * 100).toFixed(2));

  return {
    isValid: true,
    currentPercentage,
    targetPercentage: targetPercent,
    classesAttended: attended,
    totalClassesHeld: effectiveTotal,
    requiredClasses,
    projectedPercentage,
    isPossible: true,
    message: `You must attend the next ${requiredClasses} consecutive class${
      requiredClasses === 1 ? '' : 'es'
    } to achieve ${targetPercent}% attendance (projected: ${projectedPercentage}%).`,
  };
}

module.exports = {
  calculateAttendanceMetrics,
  calculateRequiredClasses,
};

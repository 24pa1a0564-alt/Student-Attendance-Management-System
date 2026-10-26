const Settings = require('../models/Settings');

/**
 * @desc    Get current attendance and institution settings
 * @route   GET /api/settings
 * @access  Private
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        minimumAttendanceThreshold: 75,
        leavePolicy: 'CountAsAbsent',
        correctionWindowHours: 48,
        institutionName: 'Apex Institute of Technology',
        academicYear: '2025-2026',
        currentSemester: 4,
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update attendance settings
 * @route   PUT /api/settings
 * @access  Private (Admin)
 */
const updateSettings = async (req, res, next) => {
  try {
    const {
      minimumAttendanceThreshold,
      leavePolicy,
      correctionWindowHours,
      institutionName,
      academicYear,
      currentSemester,
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (minimumAttendanceThreshold !== undefined) {
      settings.minimumAttendanceThreshold = Number(minimumAttendanceThreshold);
    }
    if (leavePolicy) settings.leavePolicy = leavePolicy;
    if (correctionWindowHours !== undefined) {
      settings.correctionWindowHours = Number(correctionWindowHours);
    }
    if (institutionName) settings.institutionName = institutionName;
    if (academicYear) settings.academicYear = academicYear;
    if (currentSemester !== undefined) settings.currentSemester = Number(currentSemester);
    settings.updatedBy = req.user._id;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Attendance settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};

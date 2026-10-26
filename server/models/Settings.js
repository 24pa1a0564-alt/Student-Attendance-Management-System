const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    minimumAttendanceThreshold: {
      type: Number,
      required: true,
      default: 75,
      min: [1, 'Threshold must be at least 1%'],
      max: [100, 'Threshold cannot exceed 100%'],
    },
    leavePolicy: {
      type: String,
      enum: ['CountAsAbsent', 'ExemptFromTotal', 'CountAsPresent'],
      default: 'CountAsAbsent',
    },
    correctionWindowHours: {
      type: Number,
      default: 48, // 48 hours to edit attendance
      min: [1, 'Correction window must be at least 1 hour'],
    },
    institutionName: {
      type: String,
      default: 'Apex Institute of Technology',
      trim: true,
    },
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true,
    },
    currentSemester: {
      type: Number,
      default: 4,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);

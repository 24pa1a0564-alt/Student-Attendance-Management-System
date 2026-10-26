const express = require('express');
const router = express.Router();
const {
  getAttendanceReport,
  getLowAttendanceReport,
  getDailySummary,
  exportAttendanceCSV,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/attendance', protect, authorize('admin', 'faculty'), getAttendanceReport);
router.get('/low-attendance', protect, authorize('admin', 'faculty'), getLowAttendanceReport);
router.get('/daily-summary', protect, authorize('admin', 'faculty'), getDailySummary);
router.get('/export-csv', protect, authorize('admin', 'faculty'), exportAttendanceCSV);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getStudentAttendance,
  getSubjectAttendance,
  updateAttendance,
  getAttendanceSummary,
  getTargetCalculation,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('admin', 'faculty'), markAttendance)
  .get(protect, getAttendance);

router.post('/bulk', protect, authorize('admin', 'faculty'), markBulkAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/subject/:subjectId', protect, authorize('admin', 'faculty'), getSubjectAttendance);
router.get('/summary', protect, getAttendanceSummary);
router.get('/target-calculator', protect, getTargetCalculation);

router.put('/:id', protect, authorize('admin', 'faculty'), updateAttendance);

module.exports = router;

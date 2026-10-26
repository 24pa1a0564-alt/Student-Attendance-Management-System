const express = require('express');
const router = express.Router();
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, authorize('admin'), getFaculty)
  .post(protect, authorize('admin'), createFaculty);

router
  .route('/:id')
  .get(protect, authorize('admin', 'faculty'), getFacultyById)
  .put(protect, authorize('admin'), updateFaculty)
  .delete(protect, authorize('admin'), deleteFaculty);

module.exports = router;

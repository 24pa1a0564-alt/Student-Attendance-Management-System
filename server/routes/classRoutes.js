const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getClasses)
  .post(protect, authorize('admin'), createClass);

router
  .route('/:id')
  .get(protect, getClassById)
  .put(protect, authorize('admin'), updateClass)
  .delete(protect, authorize('admin'), deleteClass);

module.exports = router;

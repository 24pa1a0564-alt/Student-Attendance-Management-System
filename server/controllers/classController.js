const Class = require('../models/Class');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');

/**
 * @desc    Get all classes with filters
 * @route   GET /api/classes
 * @access  Private
 */
const getClasses = async (req, res, next) => {
  try {
    const { department, semester, academicYear, search } = req.query;
    const query = {};

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (academicYear) query.academicYear = academicYear;

    let classes = await Class.find(query)
      .populate('subjectIds', 'subjectName subjectCode')
      .populate({
        path: 'studentIds',
        select: 'rollNumber department section semester enrollmentStatus',
        populate: { path: 'userId', select: 'name email' },
      });

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      classes = classes.filter(
        (c) => c.className.match(searchRegex) || c.department.match(searchRegex)
      );
    }

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single class by ID with all enrolled students
 * @route   GET /api/classes/:id
 * @access  Private
 */
const getClassById = async (req, res, next) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('subjectIds', 'subjectName subjectCode department semester')
      .populate({
        path: 'studentIds',
        select: 'rollNumber department section semester enrollmentStatus userId',
        populate: { path: 'userId', select: 'name email isActive' },
      });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    res.status(200).json({
      success: true,
      data: classItem,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new class
 * @route   POST /api/classes
 * @access  Private (Admin)
 */
const createClass = async (req, res, next) => {
  try {
    const {
      className,
      department,
      section,
      academicYear,
      semester,
      studentIds = [],
      subjectIds = [],
    } = req.body;

    if (!className || !department || !section || !academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide className, department, section, academicYear, and semester',
      });
    }

    // Check duplicate
    const existing = await Class.findOne({
      department: department.trim(),
      semester: Number(semester),
      section: section.toUpperCase().trim(),
      academicYear: academicYear.trim(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Class for ${department} Sem ${semester} Section ${section} (${academicYear}) already exists`,
      });
    }

    const newClass = await Class.create({
      className: className.trim(),
      department: department.trim(),
      section: section.toUpperCase().trim(),
      academicYear: academicYear.trim(),
      semester: Number(semester),
      studentIds,
      subjectIds,
      isActive: true,
    });

    // Link subjects to this class
    if (subjectIds.length > 0) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { $addToSet: { classIds: newClass._id } }
      );
    }

    const populatedClass = await Class.findById(newClass._id)
      .populate('subjectIds', 'subjectName subjectCode')
      .populate('studentIds', 'rollNumber');

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: populatedClass,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 * @access  Private (Admin)
 */
const updateClass = async (req, res, next) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    const {
      className,
      department,
      section,
      academicYear,
      semester,
      studentIds,
      subjectIds,
      isActive,
    } = req.body;

    if (className) classItem.className = className.trim();
    if (department) classItem.department = department.trim();
    if (section) classItem.section = section.toUpperCase().trim();
    if (academicYear) classItem.academicYear = academicYear.trim();
    if (semester) classItem.semester = Number(semester);
    if (studentIds) classItem.studentIds = studentIds;
    if (subjectIds) classItem.subjectIds = subjectIds;
    if (typeof isActive === 'boolean') classItem.isActive = isActive;

    await classItem.save();

    // Link subjects to this class
    if (subjectIds) {
      await Subject.updateMany(
        { _id: { $in: subjectIds } },
        { $addToSet: { classIds: classItem._id } }
      );
    }

    const updated = await Class.findById(classItem._id)
      .populate('subjectIds', 'subjectName subjectCode')
      .populate('studentIds', 'rollNumber');

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 * @access  Private (Admin)
 */
const deleteClass = async (req, res, next) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found',
      });
    }

    // Remove from faculty assigned classes
    await Faculty.updateMany(
      { assignedClasses: classItem._id },
      { $pull: { assignedClasses: classItem._id } }
    );

    // Remove from subjects
    await Subject.updateMany(
      { classIds: classItem._id },
      { $pull: { classIds: classItem._id } }
    );

    await Class.findByIdAndDelete(classItem._id);

    res.status(200).json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};

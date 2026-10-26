const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');

/**
 * @desc    Get all faculty members
 * @route   GET /api/faculty
 * @access  Private (Admin)
 */
const getFaculty = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const query = {};

    if (department) query.department = department;

    let facultyList = await Faculty.find(query)
      .populate('userId', 'name email isActive createdAt')
      .populate('assignedSubjects', 'subjectName subjectCode department semester')
      .populate('assignedClasses', 'className department section semester academicYear');

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      facultyList = facultyList.filter(
        (f) =>
          f.employeeId.match(searchRegex) ||
          (f.userId && f.userId.name && f.userId.name.match(searchRegex)) ||
          (f.userId && f.userId.email && f.userId.email.match(searchRegex))
      );
    }

    res.status(200).json({
      success: true,
      count: facultyList.length,
      data: facultyList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single faculty member by ID
 * @route   GET /api/faculty/:id
 * @access  Private (Admin, Faculty self)
 */
const getFacultyById = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('userId', 'name email isActive createdAt')
      .populate('assignedSubjects', 'subjectName subjectCode department semester')
      .populate({
        path: 'assignedClasses',
        select: 'className department section semester academicYear studentIds',
        populate: {
          path: 'studentIds',
          select: 'rollNumber department section semester',
          populate: { path: 'userId', select: 'name email' },
        },
      });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found',
      });
    }

    // Role check: Faculty can only inspect their own profile
    if (req.user.role === 'faculty' && faculty.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to faculty record',
      });
    }

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new faculty member
 * @route   POST /api/faculty
 * @access  Private (Admin)
 */
const createFaculty = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password = 'Faculty@123',
      employeeId,
      department,
      assignedSubjects = [],
      assignedClasses = [],
    } = req.body;

    if (!name || !email || !employeeId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, employeeId, and department',
      });
    }

    // Verify email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Email '${email}' is already in use`,
      });
    }

    // Verify employeeId uniqueness
    const existingFaculty = await Faculty.findOne({ employeeId: employeeId.toUpperCase().trim() });
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: `Faculty with Employee ID '${employeeId}' already exists`,
      });
    }

    // Create User
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'faculty',
      isActive: true,
    });

    // Create Faculty record
    const faculty = await Faculty.create({
      userId: user._id,
      employeeId: employeeId.toUpperCase().trim(),
      department: department.trim(),
      assignedSubjects,
      assignedClasses,
    });

    // Sync subjects and classes with this faculty
    if (assignedSubjects.length > 0) {
      await Subject.updateMany(
        { _id: { $in: assignedSubjects } },
        { $addToSet: { facultyIds: faculty._id } }
      );
    }

    const populatedFaculty = await Faculty.findById(faculty._id)
      .populate('userId', 'name email isActive')
      .populate('assignedSubjects', 'subjectName subjectCode')
      .populate('assignedClasses', 'className department section semester');

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: populatedFaculty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update faculty member
 * @route   PUT /api/faculty/:id
 * @access  Private (Admin)
 */
const updateFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found',
      });
    }

    const {
      name,
      email,
      employeeId,
      department,
      assignedSubjects,
      assignedClasses,
      isActive,
    } = req.body;

    // Update User credentials
    if (name || email || typeof isActive === 'boolean') {
      const userUpdates = {};
      if (name) userUpdates.name = name.trim();
      if (email) {
        const emailCheck = await User.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: faculty.userId },
        });
        if (emailCheck) {
          return res.status(400).json({
            success: false,
            message: `Email '${email}' is already in use`,
          });
        }
        userUpdates.email = email.toLowerCase().trim();
      }
      if (typeof isActive === 'boolean') userUpdates.isActive = isActive;

      await User.findByIdAndUpdate(faculty.userId, userUpdates);
    }

    // Check Employee ID uniqueness if updated
    if (employeeId && employeeId.toUpperCase().trim() !== faculty.employeeId) {
      const empCheck = await Faculty.findOne({
        employeeId: employeeId.toUpperCase().trim(),
        _id: { $ne: faculty._id },
      });
      if (empCheck) {
        return res.status(400).json({
          success: false,
          message: `Employee ID '${employeeId}' is already in use`,
        });
      }
      faculty.employeeId = employeeId.toUpperCase().trim();
    }

    if (department) faculty.department = department.trim();
    if (assignedSubjects) faculty.assignedSubjects = assignedSubjects;
    if (assignedClasses) faculty.assignedClasses = assignedClasses;

    await faculty.save();

    // Sync subjects
    if (assignedSubjects) {
      await Subject.updateMany(
        { _id: { $in: assignedSubjects } },
        { $addToSet: { facultyIds: faculty._id } }
      );
    }

    const updatedFaculty = await Faculty.findById(faculty._id)
      .populate('userId', 'name email isActive')
      .populate('assignedSubjects', 'subjectName subjectCode')
      .populate('assignedClasses', 'className department section semester');

    res.status(200).json({
      success: true,
      message: 'Faculty updated successfully',
      data: updatedFaculty,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete faculty member and user account
 * @route   DELETE /api/faculty/:id
 * @access  Private (Admin)
 */
const deleteFaculty = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found',
      });
    }

    // Remove faculty reference from subjects
    await Subject.updateMany({ facultyIds: faculty._id }, { $pull: { facultyIds: faculty._id } });

    // Delete user account
    await User.findByIdAndDelete(faculty.userId);

    // Delete faculty record
    await Faculty.findByIdAndDelete(faculty._id);

    res.status(200).json({
      success: true,
      message: 'Faculty member removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
};

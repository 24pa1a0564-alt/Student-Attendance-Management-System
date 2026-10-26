const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

/**
 * @desc    Get all students with search, filters & pagination
 * @route   GET /api/students
 * @access  Private (Admin, Faculty)
 */
const getStudents = async (req, res, next) => {
  try {
    const {
      search,
      department,
      section,
      semester,
      enrollmentStatus,
      classId,
      page = 1,
      limit = 50,
      sortBy = 'rollNumber',
      sortOrder = 'asc',
    } = req.query;

    const query = {};

    if (department) query.department = department;
    if (section) query.section = section.toUpperCase();
    if (semester) query.semester = Number(semester);
    if (enrollmentStatus) query.enrollmentStatus = enrollmentStatus;

    // If filtered by class
    if (classId) {
      const cls = await Class.findById(classId);
      if (cls && cls.studentIds.length > 0) {
        query._id = { $in: cls.studentIds };
      }
    }

    let studentQuery = Student.find(query).populate('userId', 'name email isActive');

    // Execute query to get all or paginate
    let students = await studentQuery.exec();

    // In-memory or pre-filter search by student name or rollNumber
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      students = students.filter(
        (s) =>
          s.rollNumber.match(searchRegex) ||
          (s.userId && s.userId.name && s.userId.name.match(searchRegex)) ||
          (s.userId && s.userId.email && s.userId.email.match(searchRegex))
      );
    }

    // Sort
    students.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (sortBy === 'name' && a.userId && b.userId) {
        valA = a.userId.name;
        valB = b.userId.name;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = students.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedStudents = students.slice(startIndex, startIndex + limitNum);

    res.status(200).json({
      success: true,
      count: paginatedStudents.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      data: paginatedStudents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private (Admin, Faculty, Student self)
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email isActive createdAt');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    // Enforce student ownership: student can only view their own profile
    if (req.user.role === 'student' && student.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to student record',
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new student and corresponding User account
 * @route   POST /api/students
 * @access  Private (Admin)
 */
const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password = 'Password@123',
      rollNumber,
      department,
      section,
      academicYear,
      semester,
      enrollmentStatus = 'Active',
      classId,
    } = req.body;

    if (!name || !email || !rollNumber || !department || !section || !academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required student details (name, email, rollNumber, department, section, academicYear, semester)',
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `User with email '${email}' already exists`,
      });
    }

    // Check existing rollNumber
    const existingStudent = await Student.findOne({ rollNumber: rollNumber.toUpperCase().trim() });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number '${rollNumber}' already exists`,
      });
    }

    // Hash password and create User
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'student',
      isActive: true,
    });

    // Create Student record
    const student = await Student.create({
      userId: user._id,
      rollNumber: rollNumber.toUpperCase().trim(),
      department: department.trim(),
      section: section.toUpperCase().trim(),
      academicYear: academicYear.trim(),
      semester: Number(semester),
      enrollmentStatus,
    });

    // Automatically link student to class if classId is provided, or find matching class
    if (classId) {
      await Class.findByIdAndUpdate(classId, { $addToSet: { studentIds: student._id } });
    } else {
      await Class.findOneAndUpdate(
        {
          department: department.trim(),
          semester: Number(semester),
          section: section.toUpperCase().trim(),
          academicYear: academicYear.trim(),
        },
        { $addToSet: { studentIds: student._id } }
      );
    }

    const populatedStudent = await Student.findById(student._id).populate('userId', 'name email isActive');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: populatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update student
 * @route   PUT /api/students/:id
 * @access  Private (Admin)
 */
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    const {
      name,
      email,
      rollNumber,
      department,
      section,
      academicYear,
      semester,
      enrollmentStatus,
      isActive,
    } = req.body;

    // Update linked user if name, email, or isActive is changed
    if (name || email || typeof isActive === 'boolean') {
      const userUpdates = {};
      if (name) userUpdates.name = name.trim();
      if (email) {
        const emailCheck = await User.findOne({
          email: email.toLowerCase().trim(),
          _id: { $ne: student.userId },
        });
        if (emailCheck) {
          return res.status(400).json({
            success: false,
            message: `Email '${email}' is already in use by another account`,
          });
        }
        userUpdates.email = email.toLowerCase().trim();
      }
      if (typeof isActive === 'boolean') userUpdates.isActive = isActive;

      await User.findByIdAndUpdate(student.userId, userUpdates);
    }

    // Check roll number uniqueness if updated
    if (rollNumber && rollNumber.toUpperCase().trim() !== student.rollNumber) {
      const rollCheck = await Student.findOne({
        rollNumber: rollNumber.toUpperCase().trim(),
        _id: { $ne: student._id },
      });
      if (rollCheck) {
        return res.status(400).json({
          success: false,
          message: `Roll number '${rollNumber}' is already in use`,
        });
      }
      student.rollNumber = rollNumber.toUpperCase().trim();
    }

    if (department) student.department = department.trim();
    if (section) student.section = section.toUpperCase().trim();
    if (academicYear) student.academicYear = academicYear.trim();
    if (semester) student.semester = Number(semester);
    if (enrollmentStatus) student.enrollmentStatus = enrollmentStatus;

    await student.save();

    const updatedStudent = await Student.findById(student._id).populate('userId', 'name email isActive');

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete student and associated user account & attendance safely
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found',
      });
    }

    // Delete attendance records for this student
    await Attendance.deleteMany({ studentId: student._id });

    // Remove student from classes
    await Class.updateMany({ studentIds: student._id }, { $pull: { studentIds: student._id } });

    // Delete user account
    await User.findByIdAndDelete(student.userId);

    // Delete student document
    await Student.findByIdAndDelete(student._id);

    res.status(200).json({
      success: true,
      message: 'Student and related records deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};

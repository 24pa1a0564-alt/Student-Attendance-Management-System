const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const Class = require('../models/Class');

/**
 * @desc    Get all subjects with filters
 * @route   GET /api/subjects
 * @access  Private
 */
const getSubjects = async (req, res, next) => {
  try {
    const { department, semester, academicYear, search } = req.query;
    const query = {};

    if (department) query.department = department;
    if (semester) query.semester = Number(semester);
    if (academicYear) query.academicYear = academicYear;

    let subjects = await Subject.find(query)
      .populate('facultyIds', 'employeeId userId')
      .populate('classIds', 'className department section semester');

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      subjects = subjects.filter(
        (s) => s.subjectCode.match(searchRegex) || s.subjectName.match(searchRegex)
      );
    }

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single subject by ID
 * @route   GET /api/subjects/:id
 * @access  Private
 */
const getSubjectById = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate({
        path: 'facultyIds',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('classIds', 'className department section semester academicYear');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new subject
 * @route   POST /api/subjects
 * @access  Private (Admin)
 */
const createSubject = async (req, res, next) => {
  try {
    const {
      subjectCode,
      subjectName,
      department,
      semester,
      academicYear,
      facultyIds = [],
      classIds = [],
    } = req.body;

    if (!subjectCode || !subjectName || !department || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (subjectCode, subjectName, department, semester, academicYear)',
      });
    }

    const existingSubject = await Subject.findOne({ subjectCode: subjectCode.toUpperCase().trim() });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: `Subject with code '${subjectCode}' already exists`,
      });
    }

    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase().trim(),
      subjectName: subjectName.trim(),
      department: department.trim(),
      semester: Number(semester),
      academicYear: academicYear.trim(),
      facultyIds,
      classIds,
      isActive: true,
    });

    // Link subject to assigned faculty
    if (facultyIds.length > 0) {
      await Faculty.updateMany(
        { _id: { $in: facultyIds } },
        { $addToSet: { assignedSubjects: subject._id } }
      );
    }

    // Link subject to assigned classes
    if (classIds.length > 0) {
      await Class.updateMany(
        { _id: { $in: classIds } },
        { $addToSet: { subjectIds: subject._id } }
      );
    }

    const populatedSubject = await Subject.findById(subject._id)
      .populate('facultyIds', 'employeeId')
      .populate('classIds', 'className');

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: populatedSubject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update subject
 * @route   PUT /api/subjects/:id
 * @access  Private (Admin)
 */
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    const {
      subjectCode,
      subjectName,
      department,
      semester,
      academicYear,
      facultyIds,
      classIds,
      isActive,
    } = req.body;

    if (subjectCode && subjectCode.toUpperCase().trim() !== subject.subjectCode) {
      const codeCheck = await Subject.findOne({
        subjectCode: subjectCode.toUpperCase().trim(),
        _id: { $ne: subject._id },
      });
      if (codeCheck) {
        return res.status(400).json({
          success: false,
          message: `Subject code '${subjectCode}' is already in use`,
        });
      }
      subject.subjectCode = subjectCode.toUpperCase().trim();
    }

    if (subjectName) subject.subjectName = subjectName.trim();
    if (department) subject.department = department.trim();
    if (semester) subject.semester = Number(semester);
    if (academicYear) subject.academicYear = academicYear.trim();
    if (typeof isActive === 'boolean') subject.isActive = isActive;
    if (facultyIds) subject.facultyIds = facultyIds;
    if (classIds) subject.classIds = classIds;

    await subject.save();

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete subject
 * @route   DELETE /api/subjects/:id
 * @access  Private (Admin)
 */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Unlink from faculty and classes
    await Faculty.updateMany({ assignedSubjects: subject._id }, { $pull: { assignedSubjects: subject._id } });
    await Class.updateMany({ subjectIds: subject._id }, { $pull: { subjectIds: subject._id } });

    await Subject.findByIdAndDelete(subject._id);

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};

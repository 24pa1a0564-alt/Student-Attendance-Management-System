const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Faculty = require('../models/Faculty');
const Settings = require('../models/Settings');
const { calculateAttendanceMetrics, calculateRequiredClasses } = require('../utils/attendanceCalculator');

/**
 * Normalize date to start of day (midnight UTC) to prevent timezone time mismatches
 */
const normalizeDate = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * @desc    Mark single attendance record
 * @route   POST /api/attendance
 * @access  Private (Admin, Faculty)
 */
const markAttendance = async (req, res, next) => {
  try {
    const { studentId, subjectId, classId, date, status, remarks } = req.body;

    if (!studentId || !subjectId || !classId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide studentId, subjectId, classId, date, and status',
      });
    }

    const attendanceDate = normalizeDate(date);
    if (!attendanceDate) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    // Role check: Faculty must be assigned to subject or class
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        return res.status(403).json({ success: false, message: 'Faculty profile not found' });
      }
      const isAssignedSubject = faculty.assignedSubjects.some((s) => s.toString() === subjectId);
      const isAssignedClass = faculty.assignedClasses.some((c) => c.toString() === classId);
      if (!isAssignedSubject && !isAssignedClass) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to mark attendance for this subject/class',
        });
      }
    }

    // Upsert record (or create)
    const record = await Attendance.findOneAndUpdate(
      { studentId, subjectId, date: attendanceDate },
      {
        studentId,
        subjectId,
        classId,
        date: attendanceDate,
        status,
        remarks: remarks || '',
        markedBy: req.user._id,
        updatedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk mark attendance for an entire class/session
 * @route   POST /api/attendance/bulk
 * @access  Private (Admin, Faculty)
 */
const markBulkAttendance = async (req, res, next) => {
  try {
    const { classId, subjectId, date, records } = req.body;

    if (!classId || !subjectId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide classId, subjectId, date, and a non-empty records array',
      });
    }

    const attendanceDate = normalizeDate(date);
    if (!attendanceDate) {
      return res.status(400).json({ success: false, message: 'Invalid date provided' });
    }

    // Faculty assignment verification
    if (req.user.role === 'faculty') {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        return res.status(403).json({ success: false, message: 'Faculty profile not found' });
      }
      const isAssignedSubject = faculty.assignedSubjects.some((s) => s.toString() === subjectId);
      const isAssignedClass = faculty.assignedClasses.some((c) => c.toString() === classId);
      if (!isAssignedSubject && !isAssignedClass) {
        return res.status(403).json({
          success: false,
          message: 'Faculty is not assigned to this subject or class',
        });
      }
    }

    // Prepare bulkWrite operations with upsert
    const bulkOperations = records.map((item) => ({
      updateOne: {
        filter: {
          studentId: item.studentId,
          subjectId,
          date: attendanceDate,
        },
        update: {
          $set: {
            studentId: item.studentId,
            subjectId,
            classId,
            date: attendanceDate,
            status: item.status,
            remarks: item.remarks || '',
            updatedBy: req.user._id,
          },
          $setOnInsert: {
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(bulkOperations);

    res.status(200).json({
      success: true,
      message: `Attendance submitted successfully for ${records.length} students`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance records with comprehensive filtering
 * @route   GET /api/attendance
 * @access  Private
 */
const getAttendance = async (req, res, next) => {
  try {
    const { studentId, subjectId, classId, date, startDate, endDate, status } = req.query;
    const query = {};

    if (studentId) query.studentId = studentId;
    if (subjectId) query.subjectId = subjectId;
    if (classId) query.classId = classId;
    if (status) query.status = status;

    if (date) {
      const d = normalizeDate(date);
      if (d) query.date = d;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = normalizeDate(startDate);
      if (endDate) {
        const end = normalizeDate(endDate);
        if (end) {
          end.setUTCHours(23, 59, 59, 999);
          query.date.$lte = end;
        }
      }
    }

    // If student role, enforce that they can only query their own attendance
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user._id });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student record not found' });
      }
      query.studentId = student._id;
    }

    const records = await Attendance.find(query)
      .populate({
        path: 'studentId',
        select: 'rollNumber department section semester userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className section department')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get student's authoritative attendance percentage & subject-wise breakdown
 * @route   GET /api/attendance/student/:studentId
 * @access  Private
 */
const getStudentAttendance = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId).populate('userId', 'name email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Student self-protection check
    if (req.user.role === 'student' && student.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to student attendance' });
    }

    // Load institution settings for threshold and leave policy
    const settings = (await Settings.findOne()) || {
      minimumAttendanceThreshold: 75,
      leavePolicy: 'CountAsAbsent',
    };

    // Fetch all attendance records for this student
    const records = await Attendance.find({ studentId: student._id })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .sort({ date: -1 });

    // Group by subject
    const subjectMap = {};
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLeave = 0;

    records.forEach((record) => {
      const subId = record.subjectId ? record.subjectId._id.toString() : 'unknown';
      const subName = record.subjectId ? record.subjectId.subjectName : 'Unknown Subject';
      const subCode = record.subjectId ? record.subjectId.subjectCode : 'N/A';

      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subjectId: subId,
          subjectName: subName,
          subjectCode: subCode,
          present: 0,
          absent: 0,
          leave: 0,
          history: [],
        };
      }

      if (record.status === 'Present') {
        subjectMap[subId].present += 1;
        totalPresent += 1;
      } else if (record.status === 'Absent') {
        subjectMap[subId].absent += 1;
        totalAbsent += 1;
      } else if (record.status === 'On Leave') {
        subjectMap[subId].leave += 1;
        totalLeave += 1;
      }

      subjectMap[subId].history.push({
        _id: record._id,
        date: record.date,
        status: record.status,
        remarks: record.remarks,
      });
    });

    // Compute subject-wise percentages
    const subjectBreakdown = Object.values(subjectMap).map((item) => {
      const metrics = calculateAttendanceMetrics(
        item.present,
        item.absent,
        item.leave,
        settings.leavePolicy
      );
      return {
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        subjectCode: item.subjectCode,
        present: item.present,
        absent: item.absent,
        leave: item.leave,
        totalClassesHeld: metrics.totalClassesHeld,
        classesAttended: metrics.classesAttended,
        percentage: metrics.percentage,
        isLowAttendance: metrics.percentage < settings.minimumAttendanceThreshold,
        history: item.history,
      };
    });

    // Compute overall institution attendance metrics
    const overallMetrics = calculateAttendanceMetrics(
      totalPresent,
      totalAbsent,
      totalLeave,
      settings.leavePolicy
    );

    const isLowAttendance =
      overallMetrics.totalClassesHeld > 0 &&
      overallMetrics.percentage < settings.minimumAttendanceThreshold;

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.userId.name,
          email: student.userId.email,
          rollNumber: student.rollNumber,
          department: student.department,
          section: student.section,
          semester: student.semester,
        },
        settings: {
          minimumAttendanceThreshold: settings.minimumAttendanceThreshold,
          leavePolicy: settings.leavePolicy,
        },
        overall: {
          ...overallMetrics,
          isLowAttendance,
        },
        subjectBreakdown,
        totalRecords: records.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance breakdown for a subject
 * @route   GET /api/attendance/subject/:subjectId
 * @access  Private (Admin, Faculty)
 */
const getSubjectAttendance = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const records = await Attendance.find({ subjectId: subject._id })
      .populate({
        path: 'studentId',
        select: 'rollNumber department section userId',
        populate: { path: 'userId', select: 'name' },
      })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        subject,
        records,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit existing attendance record within permitted correction period
 * @route   PUT /api/attendance/:id
 * @access  Private (Admin, Faculty)
 */
const updateAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const { status, remarks } = req.body;

    // Faculty permission and correction window check
    if (req.user.role === 'faculty') {
      const settings = (await Settings.findOne()) || { correctionWindowHours: 48 };
      const hoursSinceCreation = (Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60);

      if (hoursSinceCreation > settings.correctionWindowHours) {
        return res.status(403).json({
          success: false,
          message: `Correction window of ${settings.correctionWindowHours} hours has expired. Please contact an Administrator to update this attendance record.`,
        });
      }
    }

    if (status) record.status = status;
    if (remarks !== undefined) record.remarks = remarks;
    record.updatedBy = req.user._id;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance summary for a given date or class
 * @route   GET /api/attendance/summary
 * @access  Private
 */
const getAttendanceSummary = async (req, res, next) => {
  try {
    const { date, classId, subjectId } = req.query;
    const query = {};

    if (date) {
      query.date = normalizeDate(date);
    }
    if (classId) query.classId = classId;
    if (subjectId) query.subjectId = subjectId;

    const records = await Attendance.find(query);

    let present = 0;
    let absent = 0;
    let leave = 0;

    records.forEach((r) => {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'On Leave') leave++;
    });

    const total = present + absent + leave;
    const percentage = total === 0 ? 0 : Number(((present / total) * 100).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        totalRecords: total,
        present,
        absent,
        leave,
        percentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Calculate attendance target requirements
 * @route   GET /api/attendance/target-calculator
 * @access  Private
 */
const getTargetCalculation = async (req, res, next) => {
  try {
    const { attended, total, target } = req.query;

    if (attended === undefined || total === undefined || target === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide attended, total, and target parameters',
      });
    }

    const result = calculateRequiredClasses(Number(attended), Number(total), Number(target));

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  markAttendance,
  markBulkAttendance,
  getAttendance,
  getStudentAttendance,
  getSubjectAttendance,
  updateAttendance,
  getAttendanceSummary,
  getTargetCalculation,
};

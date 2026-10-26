const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Settings = require('../models/Settings');
const { calculateAttendanceMetrics } = require('../utils/attendanceCalculator');

/**
 * @desc    Generate filtered attendance report
 * @route   GET /api/reports/attendance
 * @access  Private (Admin, Faculty)
 */
const getAttendanceReport = async (req, res, next) => {
  try {
    const { department, section, semester, subjectId, studentId, startDate, endDate } = req.query;

    const studentFilter = {};
    if (department) studentFilter.department = department;
    if (section) studentFilter.section = section.toUpperCase();
    if (semester) studentFilter.semester = Number(semester);
    if (studentId) studentFilter._id = studentId;

    const students = await Student.find(studentFilter).populate('userId', 'name email');
    const studentIds = students.map((s) => s._id);

    const attendanceFilter = { studentId: { $in: studentIds } };
    if (subjectId) attendanceFilter.subjectId = subjectId;

    if (startDate || endDate) {
      attendanceFilter.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setUTCHours(0, 0, 0, 0);
        attendanceFilter.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setUTCHours(23, 59, 59, 999);
        attendanceFilter.date.$lte = e;
      }
    }

    const records = await Attendance.find(attendanceFilter)
      .populate('studentId', 'rollNumber department section semester')
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .populate('markedBy', 'name')
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
 * @desc    Get list of students with attendance below threshold (default 75%)
 * @route   GET /api/reports/low-attendance
 * @access  Private (Admin, Faculty)
 */
const getLowAttendanceReport = async (req, res, next) => {
  try {
    const { department, semester, threshold } = req.query;

    const settings = (await Settings.findOne()) || {
      minimumAttendanceThreshold: 75,
      leavePolicy: 'CountAsAbsent',
    };

    const targetThreshold = threshold ? Number(threshold) : settings.minimumAttendanceThreshold;

    const studentQuery = {};
    if (department) studentQuery.department = department;
    if (semester) studentQuery.semester = Number(semester);

    const students = await Student.find(studentQuery).populate('userId', 'name email');

    const lowAttendanceStudents = [];

    for (const student of students) {
      const records = await Attendance.find({ studentId: student._id });
      if (records.length === 0) continue;

      let present = 0;
      let absent = 0;
      let leave = 0;

      records.forEach((r) => {
        if (r.status === 'Present') present++;
        else if (r.status === 'Absent') absent++;
        else if (r.status === 'On Leave') leave++;
      });

      const metrics = calculateAttendanceMetrics(present, absent, leave, settings.leavePolicy);

      if (metrics.totalClassesHeld > 0 && metrics.percentage < targetThreshold) {
        lowAttendanceStudents.push({
          studentId: student._id,
          name: student.userId ? student.userId.name : 'Unknown',
          email: student.userId ? student.userId.email : 'Unknown',
          rollNumber: student.rollNumber,
          department: student.department,
          section: student.section,
          semester: student.semester,
          classesAttended: metrics.classesAttended,
          classesAbsent: metrics.classesAbsent,
          totalClassesHeld: metrics.totalClassesHeld,
          percentage: metrics.percentage,
          threshold: targetThreshold,
          shortfall: Number((targetThreshold - metrics.percentage).toFixed(2)),
        });
      }
    }

    // Sort by lowest percentage first
    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    res.status(200).json({
      success: true,
      count: lowAttendanceStudents.length,
      threshold: targetThreshold,
      data: lowAttendanceStudents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Daily attendance summary for institution or class
 * @route   GET /api/reports/daily-summary
 * @access  Private (Admin, Faculty)
 */
const getDailySummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setUTCHours(0, 0, 0, 0);

    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const records = await Attendance.find({
      date: { $gte: targetDate, $lt: nextDate },
    })
      .populate('classId', 'className department section')
      .populate('subjectId', 'subjectName subjectCode');

    let present = 0;
    let absent = 0;
    let leave = 0;
    const classSummary = {};

    records.forEach((r) => {
      if (r.status === 'Present') present++;
      else if (r.status === 'Absent') absent++;
      else if (r.status === 'On Leave') leave++;

      const cId = r.classId ? r.classId._id.toString() : 'unknown';
      const cName = r.classId ? r.classId.className : 'General';

      if (!classSummary[cId]) {
        classSummary[cId] = { className: cName, present: 0, absent: 0, leave: 0, total: 0 };
      }
      if (r.status === 'Present') classSummary[cId].present++;
      else if (r.status === 'Absent') classSummary[cId].absent++;
      else if (r.status === 'On Leave') classSummary[cId].leave++;
      classSummary[cId].total++;
    });

    const total = present + absent + leave;
    const overallPercentage = total === 0 ? 0 : Number(((present / total) * 100).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        total,
        present,
        absent,
        leave,
        percentage: overallPercentage,
        byClass: Object.values(classSummary),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export attendance report as CSV
 * @route   GET /api/reports/export-csv
 * @access  Private (Admin, Faculty)
 */
const exportAttendanceCSV = async (req, res, next) => {
  try {
    const { department, section, semester, subjectId, startDate, endDate } = req.query;

    const studentFilter = {};
    if (department) studentFilter.department = department;
    if (section) studentFilter.section = section.toUpperCase();
    if (semester) studentFilter.semester = Number(semester);

    const students = await Student.find(studentFilter).populate('userId', 'name email');
    const studentIds = students.map((s) => s._id);

    const attendanceFilter = { studentId: { $in: studentIds } };
    if (subjectId) attendanceFilter.subjectId = subjectId;

    if (startDate || endDate) {
      attendanceFilter.date = {};
      if (startDate) {
        const s = new Date(startDate);
        s.setUTCHours(0, 0, 0, 0);
        attendanceFilter.date.$gte = s;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setUTCHours(23, 59, 59, 999);
        attendanceFilter.date.$lte = e;
      }
    }

    const records = await Attendance.find(attendanceFilter)
      .populate({
        path: 'studentId',
        select: 'rollNumber department section semester userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Build CSV string
    const headers = [
      'Record ID',
      'Date',
      'Roll Number',
      'Student Name',
      'Email',
      'Department',
      'Semester',
      'Section',
      'Class',
      'Subject Code',
      'Subject Name',
      'Attendance Status',
      'Remarks',
      'Marked By',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    };

    const csvRows = [headers.join(',')];

    records.forEach((r) => {
      const row = [
        escapeCsv(r._id),
        escapeCsv(r.date ? new Date(r.date).toISOString().split('T')[0] : ''),
        escapeCsv(r.studentId ? r.studentId.rollNumber : ''),
        escapeCsv(r.studentId && r.studentId.userId ? r.studentId.userId.name : ''),
        escapeCsv(r.studentId && r.studentId.userId ? r.studentId.userId.email : ''),
        escapeCsv(r.studentId ? r.studentId.department : ''),
        escapeCsv(r.studentId ? r.studentId.semester : ''),
        escapeCsv(r.studentId ? r.studentId.section : ''),
        escapeCsv(r.classId ? r.classId.className : ''),
        escapeCsv(r.subjectId ? r.subjectId.subjectCode : ''),
        escapeCsv(r.subjectId ? r.subjectId.subjectName : ''),
        escapeCsv(r.status),
        escapeCsv(r.remarks || ''),
        escapeCsv(r.markedBy ? r.markedBy.name : ''),
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceReport,
  getLowAttendanceReport,
  getDailySummary,
  exportAttendanceCSV,
};

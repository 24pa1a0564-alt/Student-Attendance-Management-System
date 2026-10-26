const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const { calculateAttendanceMetrics, calculateRequiredClasses } = require('../utils/attendanceCalculator');

/**
 * @desc    Get Admin Dashboard statistics
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const settings = (await Settings.findOne()) || {
      minimumAttendanceThreshold: 75,
      leavePolicy: 'CountAsAbsent',
    };

    // 1. Total counts
    const [totalStudents, totalFaculty, totalSubjects, totalClasses] = await Promise.all([
      Student.countDocuments({ enrollmentStatus: 'Active' }),
      Faculty.countDocuments(),
      Subject.countDocuments({ isActive: true }),
      Class.countDocuments({ isActive: true }),
    ]);

    // 2. Today's attendance
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todayRecords = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayLeave = 0;

    todayRecords.forEach((r) => {
      if (r.status === 'Present') todayPresent++;
      else if (r.status === 'Absent') todayAbsent++;
      else if (r.status === 'On Leave') todayLeave++;
    });

    const todayMetrics = calculateAttendanceMetrics(
      todayPresent,
      todayAbsent,
      todayLeave,
      settings.leavePolicy
    );

    // 3. Department-wise student distribution & attendance
    const departments = ['Computer Science', 'Electronics', 'Information Technology', 'Mechanical'];
    const departmentStats = [];

    for (const dept of departments) {
      const studentCount = await Student.countDocuments({ department: dept });
      const deptStudents = await Student.find({ department: dept }).select('_id');
      const deptStudentIds = deptStudents.map((s) => s._id);

      const deptRecords = await Attendance.find({ studentId: { $in: deptStudentIds } });
      let p = 0;
      let a = 0;
      let l = 0;
      deptRecords.forEach((r) => {
        if (r.status === 'Present') p++;
        else if (r.status === 'Absent') a++;
        else if (r.status === 'On Leave') l++;
      });
      const m = calculateAttendanceMetrics(p, a, l, settings.leavePolicy);

      departmentStats.push({
        department: dept,
        studentsCount: studentCount,
        totalClasses: m.totalClassesHeld,
        attendancePercentage: m.percentage,
      });
    }

    // 4. Past 7-Day Attendance Trend
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      const endD = new Date(d);
      endD.setUTCHours(23, 59, 59, 999);

      const dayRecords = await Attendance.find({ date: { $gte: d, $lte: endD } });
      let dayP = 0;
      let dayA = 0;
      let dayL = 0;
      dayRecords.forEach((r) => {
        if (r.status === 'Present') dayP++;
        else if (r.status === 'Absent') dayA++;
        else if (r.status === 'On Leave') dayL++;
      });
      const dayMetrics = calculateAttendanceMetrics(dayP, dayA, dayL, settings.leavePolicy);

      trendData.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: dayP,
        absent: dayA,
        leave: dayL,
        percentage: dayMetrics.percentage,
      });
    }

    // 5. Students below attendance threshold
    const allStudents = await Student.find({ enrollmentStatus: 'Active' }).populate('userId', 'name email');
    let lowAttendanceCount = 0;
    const lowAttendanceList = [];

    for (const s of allStudents) {
      const records = await Attendance.find({ studentId: s._id });
      if (records.length === 0) continue;
      let sp = 0;
      let sa = 0;
      let sl = 0;
      records.forEach((r) => {
        if (r.status === 'Present') sp++;
        else if (r.status === 'Absent') sa++;
        else if (r.status === 'On Leave') sl++;
      });
      const sm = calculateAttendanceMetrics(sp, sa, sl, settings.leavePolicy);
      if (sm.totalClassesHeld > 0 && sm.percentage < settings.minimumAttendanceThreshold) {
        lowAttendanceCount++;
        if (lowAttendanceList.length < 5) {
          lowAttendanceList.push({
            studentId: s._id,
            name: s.userId ? s.userId.name : 'Unknown',
            rollNumber: s.rollNumber,
            department: s.department,
            percentage: sm.percentage,
            threshold: settings.minimumAttendanceThreshold,
          });
        }
      }
    }

    // 6. Recent attendance activities
    const recentActivity = await Attendance.find()
      .populate({
        path: 'studentId',
        select: 'rollNumber userId',
        populate: { path: 'userId', select: 'name' },
      })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .populate('markedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(6);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalStudents,
          totalFaculty,
          totalSubjects,
          totalClasses,
          todayAttendancePercentage: todayMetrics.percentage,
          todayClassesHeld: todayMetrics.totalClassesHeld,
          todayPresent,
          todayAbsent,
          lowAttendanceCount,
          minimumAttendanceThreshold: settings.minimumAttendanceThreshold,
        },
        departmentStats,
        trendData,
        lowAttendanceList,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Faculty Dashboard statistics
 * @route   GET /api/dashboard/faculty
 * @access  Private (Faculty)
 */
const getFacultyDashboard = async (req, res, next) => {
  try {
    const faculty = await Faculty.findOne({ userId: req.user._id })
      .populate('assignedSubjects', 'subjectName subjectCode department semester')
      .populate({
        path: 'assignedClasses',
        select: 'className department section semester studentIds',
      });

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const settings = (await Settings.findOne()) || {
      minimumAttendanceThreshold: 75,
      leavePolicy: 'CountAsAbsent',
    };

    // Calculate total students enrolled across assigned classes
    const studentIdSet = new Set();
    faculty.assignedClasses.forEach((cls) => {
      cls.studentIds.forEach((sid) => studentIdSet.add(sid.toString()));
    });
    const totalEnrolledStudents = studentIdSet.size;

    // Today's attendance marked by this faculty
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const todayRecords = await Attendance.find({
      markedBy: req.user._id,
      date: { $gte: todayStart, $lte: todayEnd },
    });

    let todayP = 0;
    let todayA = 0;
    let todayL = 0;
    todayRecords.forEach((r) => {
      if (r.status === 'Present') todayP++;
      else if (r.status === 'Absent') todayA++;
      else if (r.status === 'On Leave') todayL++;
    });
    const todayMetrics = calculateAttendanceMetrics(todayP, todayA, todayL, settings.leavePolicy);

    // Subject-wise attendance overview for assigned subjects
    const subjectStats = [];
    for (const sub of faculty.assignedSubjects) {
      const records = await Attendance.find({ subjectId: sub._id });
      let sp = 0;
      let sa = 0;
      let sl = 0;
      records.forEach((r) => {
        if (r.status === 'Present') sp++;
        else if (r.status === 'Absent') sa++;
        else if (r.status === 'On Leave') sl++;
      });
      const metrics = calculateAttendanceMetrics(sp, sa, sl, settings.leavePolicy);
      subjectStats.push({
        subjectId: sub._id,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        semester: sub.semester,
        totalClassesHeld: metrics.totalClassesHeld,
        percentage: metrics.percentage,
      });
    }

    // Recent marking sessions
    const recentSessions = await Attendance.find({ markedBy: req.user._id })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        faculty: {
          employeeId: faculty.employeeId,
          department: faculty.department,
          assignedClassesCount: faculty.assignedClasses.length,
          assignedSubjectsCount: faculty.assignedSubjects.length,
          totalStudents: totalEnrolledStudents,
        },
        todaySummary: {
          markedRecords: todayRecords.length,
          present: todayP,
          absent: todayA,
          leave: todayL,
          percentage: todayMetrics.percentage,
        },
        assignedClasses: faculty.assignedClasses,
        assignedSubjects: faculty.assignedSubjects,
        subjectStats,
        recentSessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Student Dashboard statistics & target calculator pre-evaluations
 * @route   GET /api/dashboard/student
 * @access  Private (Student)
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const student = await Student.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const settings = (await Settings.findOne()) || {
      minimumAttendanceThreshold: 75,
      leavePolicy: 'CountAsAbsent',
    };

    // Fetch all attendance for student
    const records = await Attendance.find({ studentId: student._id })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .sort({ date: -1 });

    let totalP = 0;
    let totalA = 0;
    let totalL = 0;
    const subjectMap = {};

    records.forEach((r) => {
      const subId = r.subjectId ? r.subjectId._id.toString() : 'unknown';
      const subName = r.subjectId ? r.subjectId.subjectName : 'General';
      const subCode = r.subjectId ? r.subjectId.subjectCode : 'GEN';

      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subjectId: subId,
          subjectName: subName,
          subjectCode: subCode,
          present: 0,
          absent: 0,
          leave: 0,
          recent: [],
        };
      }

      if (r.status === 'Present') {
        totalP++;
        subjectMap[subId].present++;
      } else if (r.status === 'Absent') {
        totalA++;
        subjectMap[subId].absent++;
      } else if (r.status === 'On Leave') {
        totalL++;
        subjectMap[subId].leave++;
      }

      if (subjectMap[subId].recent.length < 5) {
        subjectMap[subId].recent.push({
          date: r.date,
          status: r.status,
          remarks: r.remarks,
        });
      }
    });

    const overallMetrics = calculateAttendanceMetrics(totalP, totalA, totalL, settings.leavePolicy);

    const subjectCards = Object.values(subjectMap).map((item) => {
      const sm = calculateAttendanceMetrics(item.present, item.absent, item.leave, settings.leavePolicy);
      return {
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        subjectCode: item.subjectCode,
        classesAttended: sm.classesAttended,
        classesAbsent: item.absent,
        classesOnLeave: item.leave,
        totalClassesHeld: sm.totalClassesHeld,
        percentage: sm.percentage,
        isLowAttendance: sm.percentage < settings.minimumAttendanceThreshold,
        recent: item.recent,
      };
    });

    // Calculate default target requirements (75% and 85%)
    const target75 = calculateRequiredClasses(overallMetrics.classesAttended, overallMetrics.totalClassesHeld, 75);
    const target85 = calculateRequiredClasses(overallMetrics.classesAttended, overallMetrics.totalClassesHeld, 85);

    // Recent 10 history records
    const recentHistory = records.slice(0, 10).map((r) => ({
      _id: r._id,
      date: r.date,
      status: r.status,
      subjectName: r.subjectId ? r.subjectId.subjectName : 'N/A',
      subjectCode: r.subjectId ? r.subjectId.subjectCode : 'N/A',
      remarks: r.remarks,
    }));

    res.status(200).json({
      success: true,
      data: {
        profile: {
          name: student.userId.name,
          email: student.userId.email,
          rollNumber: student.rollNumber,
          department: student.department,
          section: student.section,
          semester: student.semester,
          academicYear: student.academicYear,
        },
        settings: {
          minimumAttendanceThreshold: settings.minimumAttendanceThreshold,
          leavePolicy: settings.leavePolicy,
        },
        overall: {
          ...overallMetrics,
          isLowAttendance:
            overallMetrics.totalClassesHeld > 0 &&
            overallMetrics.percentage < settings.minimumAttendanceThreshold,
        },
        subjectCards,
        targetProjections: {
          target75,
          target85,
        },
        recentHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard,
};

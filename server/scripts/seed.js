const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections safely
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Subject.deleteMany({}),
      Class.deleteMany({}),
      Attendance.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    // 1. Create Default Settings
    console.log('[Seed] Initializing settings...');
    await Settings.create({
      minimumAttendanceThreshold: 75,
      leavePolicy: 'CountAsAbsent',
      correctionWindowHours: 48,
      institutionName: 'Apex Institute of Technology',
      academicYear: '2025-2026',
      currentSemester: 4,
    });

    // 2. Create Initial Administrator
    console.log('[Seed] Creating Administrator account...');
    const adminPasswordHash = await User.hashPassword(
      process.env.INITIAL_ADMIN_PASSWORD || 'Admin@123456'
    );
    const admin = await User.create({
      name: process.env.INITIAL_ADMIN_NAME || 'System Administrator',
      email: (process.env.INITIAL_ADMIN_EMAIL || 'admin@attendance.edu').toLowerCase(),
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true,
    });

    // 3. Create Faculty Users & Profiles
    console.log('[Seed] Creating Faculty members...');
    const facultyData = [
      {
        name: 'Dr. Robert Miller',
        email: 'robert.miller@attendance.edu',
        employeeId: 'FAC101',
        department: 'Computer Science',
      },
      {
        name: 'Prof. Anita Sharma',
        email: 'anita.sharma@attendance.edu',
        employeeId: 'FAC102',
        department: 'Computer Science',
      },
      {
        name: 'Dr. David Chen',
        email: 'david.chen@attendance.edu',
        employeeId: 'FAC103',
        department: 'Electronics',
      },
      {
        name: 'Prof. Sarah Jenkins',
        email: 'sarah.jenkins@attendance.edu',
        employeeId: 'FAC104',
        department: 'Information Technology',
      },
    ];

    const facultyDocs = [];
    const facultyUserDocs = [];
    const defaultFacultyPassword = await User.hashPassword('Faculty@123');

    for (const f of facultyData) {
      const user = await User.create({
        name: f.name,
        email: f.email,
        passwordHash: defaultFacultyPassword,
        role: 'faculty',
        isActive: true,
      });
      facultyUserDocs.push(user);

      const faculty = await Faculty.create({
        userId: user._id,
        employeeId: f.employeeId,
        department: f.department,
        assignedSubjects: [],
        assignedClasses: [],
      });
      facultyDocs.push(faculty);
    }

    // 4. Create Subjects
    console.log('[Seed] Creating Subjects...');
    const subjectsData = [
      {
        subjectCode: 'CS401',
        subjectName: 'Design & Analysis of Algorithms',
        department: 'Computer Science',
        semester: 4,
        academicYear: '2025-2026',
        facultyIds: [facultyDocs[0]._id],
      },
      {
        subjectCode: 'CS402',
        subjectName: 'Database Management Systems',
        department: 'Computer Science',
        semester: 4,
        academicYear: '2025-2026',
        facultyIds: [facultyDocs[1]._id],
      },
      {
        subjectCode: 'CS403',
        subjectName: 'Operating Systems',
        department: 'Computer Science',
        semester: 4,
        academicYear: '2025-2026',
        facultyIds: [facultyDocs[0]._id, facultyDocs[1]._id],
      },
      {
        subjectCode: 'EC401',
        subjectName: 'Signals and Systems',
        department: 'Electronics',
        semester: 4,
        academicYear: '2025-2026',
        facultyIds: [facultyDocs[2]._id],
      },
      {
        subjectCode: 'IT401',
        subjectName: 'Web Technologies & Cloud Computing',
        department: 'Information Technology',
        semester: 4,
        academicYear: '2025-2026',
        facultyIds: [facultyDocs[3]._id],
      },
    ];

    const subjectDocs = await Subject.insertMany(subjectsData);

    // 5. Create Classes
    console.log('[Seed] Creating Classes...');
    const classData = [
      {
        className: 'CSE-4A',
        department: 'Computer Science',
        section: 'A',
        academicYear: '2025-2026',
        semester: 4,
        subjectIds: [subjectDocs[0]._id, subjectDocs[1]._id, subjectDocs[2]._id],
        studentIds: [],
      },
      {
        className: 'CSE-4B',
        department: 'Computer Science',
        section: 'B',
        academicYear: '2025-2026',
        semester: 4,
        subjectIds: [subjectDocs[0]._id, subjectDocs[1]._id],
        studentIds: [],
      },
      {
        className: 'ECE-4A',
        department: 'Electronics',
        section: 'A',
        academicYear: '2025-2026',
        semester: 4,
        subjectIds: [subjectDocs[3]._id],
        studentIds: [],
      },
      {
        className: 'IT-4A',
        department: 'Information Technology',
        section: 'A',
        academicYear: '2025-2026',
        semester: 4,
        subjectIds: [subjectDocs[4]._id],
        studentIds: [],
      },
    ];

    const classDocs = await Class.insertMany(classData);

    // Update Faculty assigned subjects and classes
    facultyDocs[0].assignedSubjects = [subjectDocs[0]._id, subjectDocs[2]._id];
    facultyDocs[0].assignedClasses = [classDocs[0]._id, classDocs[1]._id];
    await facultyDocs[0].save();

    facultyDocs[1].assignedSubjects = [subjectDocs[1]._id, subjectDocs[2]._id];
    facultyDocs[1].assignedClasses = [classDocs[0]._id];
    await facultyDocs[1].save();

    facultyDocs[2].assignedSubjects = [subjectDocs[3]._id];
    facultyDocs[2].assignedClasses = [classDocs[2]._id];
    await facultyDocs[2].save();

    facultyDocs[3].assignedSubjects = [subjectDocs[4]._id];
    facultyDocs[3].assignedClasses = [classDocs[3]._id];
    await facultyDocs[3].save();

    // 6. Create 18 Fictional Students
    console.log('[Seed] Creating 18 Fictional Students...');
    const rawStudents = [
      { name: 'Alex Johnson', email: 'alex.j@attendance.edu', rollNumber: 'CS2026001', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Brian Smith', email: 'brian.s@attendance.edu', rollNumber: 'CS2026002', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Catherine Williams', email: 'catherine.w@attendance.edu', rollNumber: 'CS2026003', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Daniel Brown', email: 'daniel.b@attendance.edu', rollNumber: 'CS2026004', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Emily Davis', email: 'emily.d@attendance.edu', rollNumber: 'CS2026005', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Felix Martinez', email: 'felix.m@attendance.edu', rollNumber: 'CS2026006', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Grace Wilson', email: 'grace.w@attendance.edu', rollNumber: 'CS2026007', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Hannah Taylor', email: 'hannah.t@attendance.edu', rollNumber: 'CS2026008', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Ian Anderson', email: 'ian.a@attendance.edu', rollNumber: 'CS2026009', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Jessica Thomas', email: 'jessica.t@attendance.edu', rollNumber: 'CS2026010', dept: 'Computer Science', sec: 'A', sem: 4, classIdx: 0 },
      { name: 'Kevin Jackson', email: 'kevin.j@attendance.edu', rollNumber: 'CS2026011', dept: 'Computer Science', sec: 'B', sem: 4, classIdx: 1 },
      { name: 'Laura White', email: 'laura.w@attendance.edu', rollNumber: 'CS2026012', dept: 'Computer Science', sec: 'B', sem: 4, classIdx: 1 },
      { name: 'Michael Harris', email: 'michael.h@attendance.edu', rollNumber: 'CS2026013', dept: 'Computer Science', sec: 'B', sem: 4, classIdx: 1 },
      { name: 'Natalie Martin', email: 'natalie.m@attendance.edu', rollNumber: 'EC2026001', dept: 'Electronics', sec: 'A', sem: 4, classIdx: 2 },
      { name: 'Oliver Thompson', email: 'oliver.t@attendance.edu', rollNumber: 'EC2026002', dept: 'Electronics', sec: 'A', sem: 4, classIdx: 2 },
      { name: 'Penelope Garcia', email: 'penelope.g@attendance.edu', rollNumber: 'EC2026003', dept: 'Electronics', sec: 'A', sem: 4, classIdx: 2 },
      { name: 'Quinn Robinson', email: 'quinn.r@attendance.edu', rollNumber: 'IT2026001', dept: 'Information Technology', sec: 'A', sem: 4, classIdx: 3 },
      { name: 'Ryan Clark', email: 'ryan.c@attendance.edu', rollNumber: 'IT2026002', dept: 'Information Technology', sec: 'A', sem: 4, classIdx: 3 },
    ];

    const studentPassword = await User.hashPassword('Student@123');
    const studentDocs = [];

    for (const rs of rawStudents) {
      const user = await User.create({
        name: rs.name,
        email: rs.email,
        passwordHash: studentPassword,
        role: 'student',
        isActive: true,
      });

      const student = await Student.create({
        userId: user._id,
        rollNumber: rs.rollNumber,
        department: rs.dept,
        section: rs.sec,
        academicYear: '2025-2026',
        semester: rs.sem,
        enrollmentStatus: 'Active',
      });

      studentDocs.push(student);

      // Add to class
      await Class.findByIdAndUpdate(classDocs[rs.classIdx]._id, {
        $addToSet: { studentIds: student._id },
      });
    }

    // 7. Generate Historical Attendance Records across Past 14 Days
    console.log('[Seed] Generating historical attendance records...');
    const attendanceRecords = [];
    const subjectsForCSE = [subjectDocs[0], subjectDocs[1], subjectDocs[2]];

    // Create 10 distinct attendance dates over previous 2 weeks
    const dates = [];
    for (let i = 14; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      // Skip weekends (0 is Sunday, 6 is Saturday)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        d.setUTCHours(0, 0, 0, 0);
        dates.push(d);
      }
    }

    // Generate records for Section A students (first 10 students)
    const sectionAStudents = studentDocs.slice(0, 10);

    for (const date of dates) {
      for (const subject of subjectsForCSE) {
        for (let i = 0; i < sectionAStudents.length; i++) {
          const student = sectionAStudents[i];

          // Realistic distribution:
          // Most students have ~80-95% attendance
          // Daniel Brown (index 3) and Hannah Taylor (index 7) have low attendance (<75%) for alerts demo
          let status = 'Present';
          if (i === 3) {
            // Daniel: frequent absents (around 60%)
            status = Math.random() < 0.6 ? 'Absent' : 'Present';
          } else if (i === 7) {
            // Hannah: around 68%
            status = Math.random() < 0.4 ? 'Absent' : 'Present';
          } else {
            // General students: 90% Present, 5% Leave, 5% Absent
            const rand = Math.random();
            if (rand > 0.93) status = 'On Leave';
            else if (rand > 0.85) status = 'Absent';
            else status = 'Present';
          }

          attendanceRecords.push({
            studentId: student._id,
            subjectId: subject._id,
            classId: classDocs[0]._id,
            date,
            status,
            markedBy: facultyUserDocs[0]._id,
            remarks: status === 'On Leave' ? 'Medical slip submitted' : '',
          });
        }
      }
    }

    // Insert attendance in chunks
    console.log(`[Seed] Inserting ${attendanceRecords.length} attendance records...`);
    await Attendance.insertMany(attendanceRecords);

    console.log('\n======================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('\nDefault Test Accounts:');
    console.log('------------------------------------------------------');
    console.log('1. ADMINISTRATOR:');
    console.log('   Email:    admin@attendance.edu');
    console.log('   Password: Admin@123456');
    console.log('\n2. FACULTY:');
    console.log('   Email:    robert.miller@attendance.edu (or anita.sharma@attendance.edu)');
    console.log('   Password: Faculty@123');
    console.log('\n3. STUDENT (Standard):');
    console.log('   Email:    alex.j@attendance.edu');
    console.log('   Password: Student@123');
    console.log('   Roll No:  CS2026001');
    console.log('\n4. STUDENT (Low Attendance for alert demo):');
    console.log('   Email:    daniel.b@attendance.edu');
    console.log('   Password: Student@123');
    console.log('   Roll No:  CS2026004');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed database: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();

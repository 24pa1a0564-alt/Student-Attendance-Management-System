const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

let mongoServer;
let adminToken;
let facultyToken;
let studentToken;
let testStudentId;
let testSubjectId;
let testClassId;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Setup test users
  const adminPasswordHash = await User.hashPassword('Admin@123456');
  const adminUser = await User.create({
    name: 'Test Admin',
    email: 'admin@test.edu',
    passwordHash: adminPasswordHash,
    role: 'admin',
    isActive: true,
  });

  const facultyPasswordHash = await User.hashPassword('Faculty@123');
  const facultyUser = await User.create({
    name: 'Test Faculty',
    email: 'faculty@test.edu',
    passwordHash: facultyPasswordHash,
    role: 'faculty',
    isActive: true,
  });

  const facultyProfile = await Faculty.create({
    userId: facultyUser._id,
    employeeId: 'TF001',
    department: 'Computer Science',
  });

  const studentPasswordHash = await User.hashPassword('Student@123');
  const studentUser = await User.create({
    name: 'Test Student',
    email: 'student@test.edu',
    passwordHash: studentPasswordHash,
    role: 'student',
    isActive: true,
  });

  const studentProfile = await Student.create({
    userId: studentUser._id,
    rollNumber: 'TS2026001',
    department: 'Computer Science',
    section: 'A',
    academicYear: '2025-2026',
    semester: 4,
  });
  testStudentId = studentProfile._id;

  // Setup Subject & Class
  const subject = await Subject.create({
    subjectCode: 'TS101',
    subjectName: 'Test Algorithms',
    department: 'Computer Science',
    semester: 4,
    academicYear: '2025-2026',
    facultyIds: [facultyProfile._id],
  });
  testSubjectId = subject._id;

  const classDoc = await Class.create({
    className: 'TEST-4A',
    department: 'Computer Science',
    section: 'A',
    academicYear: '2025-2026',
    semester: 4,
    studentIds: [studentProfile._id],
    subjectIds: [subject._id],
  });
  testClassId = classDoc._id;

  facultyProfile.assignedSubjects.push(subject._id);
  facultyProfile.assignedClasses.push(classDoc._id);
  await facultyProfile.save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. Authentication API (/api/auth)', () => {
  test('POST /api/auth/login - authenticates admin with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.edu', password: 'Admin@123456' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
    adminToken = res.body.token;
  });

  test('POST /api/auth/login - authenticates faculty member', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@test.edu', password: 'Faculty@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    facultyToken = res.body.token;
  });

  test('POST /api/auth/login - authenticates student', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@test.edu', password: 'Student@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    studentToken = res.body.token;
  });

  test('POST /api/auth/login - returns generic error on invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.edu', password: 'WrongPassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

  test('POST /api/auth/login - returns generic error on non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.edu', password: 'Password@123' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('2. Role-Based Authorization & Student CRUD', () => {
  let createdStudentId;

  test('POST /api/students - Admin can create a new student', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Student',
        email: 'newstudent@test.edu',
        rollNumber: 'TS2026002',
        department: 'Computer Science',
        section: 'A',
        academicYear: '2025-2026',
        semester: 4,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rollNumber).toBe('TS2026002');
    createdStudentId = res.body.data._id;
  });

  test('POST /api/students - Student role cannot create a student (Forbidden 403)', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Hacker Student',
        email: 'hacker@test.edu',
        rollNumber: 'TS2026999',
        department: 'Computer Science',
        section: 'A',
        academicYear: '2025-2026',
        semester: 4,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/students - Prevents duplicate roll number', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Duplicate Student',
        email: 'duplicate@test.edu',
        rollNumber: 'TS2026002', // Already used
        department: 'Computer Science',
        section: 'A',
        academicYear: '2025-2026',
        semester: 4,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already exists');
  });

  test('DELETE /api/students/:id - Admin can delete a student', async () => {
    const res = await request(app)
      .delete(`/api/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('3. Attendance Creation, Prevention of Duplicates & Calculations', () => {
  const attendanceDate = '2026-03-10';

  test('POST /api/attendance - Faculty can mark student attendance', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        studentId: testStudentId,
        subjectId: testSubjectId,
        classId: testClassId,
        date: attendanceDate,
        status: 'Present',
        remarks: 'Attended full lecture',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Present');
  });

  test('POST /api/attendance/bulk - Bulk marking attendance', async () => {
    const res = await request(app)
      .post('/api/attendance/bulk')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        classId: testClassId,
        subjectId: testSubjectId,
        date: '2026-03-11',
        records: [
          {
            studentId: testStudentId,
            status: 'Absent',
            remarks: 'Uninformed absence',
          },
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('GET /api/attendance/student/:studentId - Authoritative attendance percentage calculation', async () => {
    const res = await request(app)
      .get(`/api/attendance/student/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // Student has 1 Present and 1 Absent -> 1/2 = 50%
    expect(res.body.data.overall.classesAttended).toBe(1);
    expect(res.body.data.overall.totalClassesHeld).toBe(2);
    expect(res.body.data.overall.percentage).toBe(50);
    expect(res.body.data.overall.isLowAttendance).toBe(true);
  });

  test('GET /api/attendance/student/:studentId - Student cannot view other students attendance', async () => {
    // Fake student ID
    const fakeStudentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/attendance/student/${fakeStudentId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(404); // Or 403
  });
});

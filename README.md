# 🎓 Student Attendance Management System (SAMS)

> A modern, role-based, full-stack Web Application built on the **MERN** stack (MongoDB, Express.js, React.js, Node.js) for automating student attendance tracking, institutional compliance reporting, and predictive attendance target analytics.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-blue.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-v6%2B-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-23%2F23%20Passing-brightgreen.svg)]()

---

## 📌 Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Statement](#2-problem-statement)
- [3. Objectives](#3-objectives)
- [4. Key Features](#4-key-features)
  - [A. Administrator Portal](#a-administrator-portal)
  - [B. Faculty Portal](#b-faculty-portal)
  - [C. Student Portal](#c-student-portal)
- [5. Technology Stack](#5-technology-stack)
- [6. Architecture Overview](#6-architecture-overview)
- [7. Folder Structure](#7-folder-structure)
- [8. Attendance Calculation Formulas](#8-attendance-calculation-formulas)
- [9. Prerequisites](#9-prerequisites)
- [10. Installation & Setup](#10-installation--setup)
- [11. MongoDB Atlas Configuration](#11-mongodb-atlas-configuration)
- [12. Environment Variables](#12-environment-variables)
- [13. Database Seeding](#13-database-seeding)
- [14. Running the Application Locally](#14-running-the-application-locally)
- [15. Running Automated Tests](#15-running-automated-tests)
- [16. REST API Documentation](#16-rest-api-documentation)
- [17. Security Architecture](#17-security-architecture)
- [18. Screenshots Section](#18-screenshots-section)
- [19. Deployment Guide](#19-deployment-guide)
- [20. Future Enhancements](#20-future-enhancements)
- [21. License](#21-license)

---

## 1. Project Overview

The **Student Attendance Management System (SAMS)** is a digital full-stack web application designed for universities, colleges, and higher-education institutions. It replaces error-prone physical roll-call paper registers with an automated, role-governed digital solution.

The system caters to three primary stakeholder roles:
1. **System Administrator:** Oversees academic entities (departments, faculties, students, courses, classes) and generates analytical compliance reports.
2. **Faculty Members:** Records daily lecture attendance for assigned courses with one-click bulk status toggling and updates records within institutional correction windows.
3. **Students:** Monitors course-wise and cumulative attendance percentages in real-time, receives early warning alerts when falling below minimum criteria (e.g., 75%), and uses an interactive target calculator to determine how many upcoming lectures must be attended.

---

## 2. Problem Statement

Traditional university attendance management suffers from:
- **High Paperwork & Time Loss:** Instructors expend 10–15 minutes of every lecture manually passing rosters or calling names.
- **Proxy Attendance & Tampering:** Paper-based registers are susceptible to proxy marking and unrecorded modifications.
- **Delayed Intervention:** Students only discover that their attendance is below 75% at the end of the semester when exam hall tickets are blocked.
- **Complex Aggregation:** Calculating weighted attendance averages across irregular lab slots and holidays manually introduces statistical discrepancies.

---

## 3. Objectives

- Eliminate physical paperwork by digitizing student attendance recording.
- Enforce strict database-level unique compound constraints `(studentId + subjectId + date)` to prevent duplicate submissions.
- Implement server-side authoritative attendance calculations that cannot be manipulated by frontend requests.
- Provide students with predictive mathematical forecasting tools (Attendance Target Calculator) to proactively rectify attendance shortfalls.
- Offer exportable spreadsheet reports (CSV format) for accreditation audits and parent-teacher meetings.

---

## 4. Key Features

### A. Administrator Portal
- **Executive Analytics Dashboard:** Total counts of active students, faculty members, subjects, classes, and today's institutional attendance rate.
- **Early-Warning Compliance Watchlist:** Dynamic list of students whose attendance falls below configurable criteria (default 75%).
- **Visual Analytics:** 7-day institutional participation trends and departmental attendance distributions rendered via interactive Recharts.
- **Student Lifecycle Management (CRUD):** Enroll students, update academic allocations (department, semester, section), and safely delete records with confirmation modals.
- **Faculty Management (CRUD):** Register instructors, allocate courses and classes, and deactivate accounts without deleting historical logs.
- **Subject & Class Curriculum Management:** Create subjects and map sections with validation to eliminate duplicate course codes.
- **Audit Reports & CSV Export:** Download comprehensive CSV reports filtered by date range, department, section, and low-attendance thresholds.

### B. Faculty Portal
- **Teaching Workspace Dashboard:** Real-time summary of assigned subjects, enrolled class rosters, and today's marked logs.
- **Fast Attendance Marking Form:**
  - Select class, subject, and date.
  - One-click **"Mark All Present"** and **"Mark All Absent"** presets.
  - Individual student status toggles: **Present**, **Absent**, or **On Leave**.
  - Optional remark input (e.g. "Late arrival", "Approved medical leave").
  - Auto-loads existing submissions if attendance was previously taken for that date.
- **Correction Window Protection:** Faculty can edit past submissions within an authorized institutional window (e.g. 48 hours). After this window, records lock to prevent retrospective manipulation.
- **Assigned Course Statistics:** Course-wise attendance percentages computed directly from database entries.

### C. Student Portal
- **Personal Academic Dashboard:** Overall attendance percentage, attended lectures, absences, and approved leaves.
- **Low-Attendance Alert Banner:** Prominent warning alert triggered when attendance dips below minimum requirement.
- **Course-Wise Breakdown Cards:** Individual percentage indicators, attendance ratios, and direct link to the Target Calculator.
- **Attendance Target Calculator:** An interactive calculator that computes exactly how many consecutive future classes must be attended to achieve a desired percentage (e.g. 75%, 80%, 85%, 90%).
- **Attendance History Log:** Full chronological list of lecture logs with status badges and filterable by date range and status.
- **Secure Self-Service:** Profile review and password change with old-password verification.

---

## 5. Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React.js (v19), Vite (v6+), JavaScript (ES6+) |
| **Styling & Icons** | Tailwind CSS (v4), Lucide React Icons |
| **Data Visualization** | Recharts (Responsive Area and Bar Charts) |
| **Routing & HTTP** | React Router DOM (v7), Axios |
| **Backend Runtime** | Node.js (v18+), Express.js |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs, HTTP-only Cookies |
| **Security Middleware** | Helmet, Express Rate Limit, Morgan, CORS |
| **Database & ODM** | MongoDB Atlas, Mongoose (v8+) |
| **Testing** | Jest, Supertest, MongoMemoryServer (In-memory tests) |

---

## 6. Architecture Overview

```
                          ┌───────────────────────────┐
                          │   React.js Single Page    │
                          │   Application (Vite SPA)  │
                          └─────────────┬─────────────┘
                                        │
                         HTTP / REST API Requests
                         (JWT Bearer / HTTP Cookie)
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │  Express.js REST Service  │
                          │   (Node.js HTTP Server)   │
                          └─────────────┬─────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│  Auth Middleware │          │ Role Permission  │          │ Attendance Logic │
│  (JWT Verify)    │          │  (RBAC Guards)   │          │  & Target Calc   │
└──────────────────┘          └──────────────────┘          └──────────────────┘
         │                              │                              │
         └──────────────────────────────┼──────────────────────────────┘
                                        │
                               Mongoose Models
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │       MongoDB Atlas       │
                          │     Cloud / In-Memory     │
                          └───────────────────────────┘
```

---

## 7. Folder Structure

```
student-attendance-management-system/
├── client/                                 # Frontend React application
│   ├── public/
│   │   └── favicon.svg                     # System graduation cap icon
│   ├── src/
│   │   ├── components/                     # Reusable UI widgets
│   │   │   ├── ConfirmDialog.jsx           # Deletion confirmation modal
│   │   │   ├── EmptyState.jsx              # Empty table placeholder
│   │   │   ├── LoadingSpinner.jsx          # Accessible loading spinner
│   │   │   ├── Modal.jsx                   # Reusable accessible dialog
│   │   │   ├── Navbar.jsx                  # Top navigation bar
│   │   │   ├── Sidebar.jsx                 # Collapsible role sidebar
│   │   │   ├── StatsCard.jsx               # Statistical KPI metric card
│   │   │   ├── StatusBadge.jsx             # Present/Absent/Leave chips
│   │   │   └── TargetCalculatorModal.jsx   # Interactive target calculator
│   │   ├── context/
│   │   │   ├── AuthContext.jsx             # User authentication session
│   │   │   └── ToastContext.jsx            # Toast alert notifications
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx         # App shell (Nav + Sidebar + Outlet)
│   │   ├── pages/                          # Application views
│   │   │   ├── AdminDashboard.jsx          # Admin overview & charts
│   │   │   ├── AttendanceMarking.jsx       # Faculty/Admin roll-call marking
│   │   │   ├── AttendanceReports.jsx       # Filterable reports & CSV export
│   │   │   ├── ChangePasswordPage.jsx      # Password change form
│   │   │   ├── ClassManagement.jsx         # Class section CRUD
│   │   │   ├── FacultyDashboard.jsx        # Instructor schedule & metrics
│   │   │   ├── FacultyManagement.jsx       # Instructor CRUD & assignments
│   │   │   ├── LoginPage.jsx               # Login with demo accounts
│   │   │   ├── NotFoundPage.jsx            # 404 handler
│   │   │   ├── ProfilePage.jsx             # User academic profile
│   │   │   ├── StudentAttendanceHistory.jsx# Student historical log
│   │   │   ├── StudentDashboard.jsx        # Student portal & projections
│   │   │   ├── StudentManagement.jsx       # Student CRUD & enrollment
│   │   │   └── SubjectManagement.jsx       # Subject course CRUD
│   │   ├── services/
│   │   │   └── api.js                      # Axios instance with interceptors
│   │   ├── App.jsx                         # Route tree with RBAC guards
│   │   ├── index.css                       # Global styles & Tailwind
│   │   └── main.jsx                        # React root entry
│   ├── .env.example                        # Frontend environment template
│   ├── index.html                          # HTML shell
│   ├── package.json                        # Frontend dependencies
│   └── vite.config.js                      # Vite & proxy configuration
│
├── server/                                 # Backend REST API service
│   ├── config/
│   │   └── db.js                           # MongoDB Mongoose connection
│   ├── controllers/                        # Request handlers
│   │   ├── attendanceController.js         # Single/bulk mark & metrics
│   │   ├── authController.js               # Login, logout, me, change-password
│   │   ├── classController.js              # Class cohort CRUD
│   │   ├── dashboardController.js          # Tailored role dashboard data
│   │   ├── facultyController.js            # Faculty instructor CRUD
│   │   ├── reportController.js             # Analytics, low-attendance & CSV
│   │   ├── settingController.js            # Institutional threshold settings
│   │   ├── studentController.js            # Student enrollment CRUD
│   │   └── subjectController.js            # Course subject CRUD
│   ├── middleware/                         # Express middlewares
│   │   ├── auth.js                         # JWT verify & RBAC authorization
│   │   └── errorHandler.js                 # Central error handler
│   ├── models/                             # Mongoose schemas
│   │   ├── Attendance.js                   # Attendance schema (compound index)
│   │   ├── Class.js                        # Class cohort schema
│   │   ├── Faculty.js                      # Faculty profile schema
│   │   ├── Settings.js                     # Global attendance settings
│   │   ├── Student.js                      # Student enrollment schema
│   │   ├── Subject.js                      # Subject course schema
│   │   └── User.js                         # Core user credentials schema
│   ├── routes/                             # Express route endpoints
│   │   ├── attendanceRoutes.js
│   │   ├── authRoutes.js
│   │   ├── classRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── facultyRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── settingRoutes.js
│   │   ├── studentRoutes.js
│   │   └── subjectRoutes.js
│   ├── scripts/
│   │   └── seed.js                         # Database seed script
│   ├── tests/                              # Automated test suites
│   │   ├── api.test.js                     # Supertest API integration tests
│   │   └── calculator.test.js              # Unit tests for attendance math
│   ├── utils/
│   │   └── attendanceCalculator.js         # Formulas & Target calculator
│   ├── app.js                              # Express app configuration
│   ├── server.js                           # Server bootstrapper & listener
│   ├── .env.example                        # Backend environment template
│   └── package.json                        # Backend dependencies & test scripts
│
├── .gitignore                              # Git exclusion rules
├── LICENSE                                 # MIT License
├── package.json                            # Workspace root helper scripts
└── README.md                               # Complete project documentation
```

---

## 8. Attendance Calculation Formulas

### 1. Attendance Percentage Formula
$$\text{Attendance Percentage} = \left( \frac{\text{Classes Attended}}{\text{Total Classes Held}} \right) \times 100$$

- **Present:** Counted as attended ($+1$).
- **Absent:** Counted as not attended ($0$).
- **On Leave:** Evaluated according to institutional policy:
  - `CountAsAbsent` *(default)*: $\text{Total Held} = P + A + L, \quad \text{Attended} = P$
  - `ExemptFromTotal`: $\text{Total Held} = P + A, \quad \text{Attended} = P$
  - `CountAsPresent`: $\text{Total Held} = P + A + L, \quad \text{Attended} = P + L$

### 2. Attendance Target Calculator Formula
Calculates the exact number of consecutive upcoming classes ($X$) a student must attend to reach a target decimal percentage ($T$):

$$\frac{\text{Attended} + X}{\text{Total} + X} \ge T$$

$$X \cdot (1 - T) \ge (T \cdot \text{Total}) - \text{Attended}$$

$$X = \left\lceil \frac{T \cdot \text{Total} - \text{Attended}}{1 - T} \right\rceil$$

**Edge Cases Handled:**
- $\text{Current Percentage} \ge \text{Target}$: Returns `0` classes required (Target already achieved).
- $\text{Total Classes} = 0$: Returns `1` class required (attending the next class yields 100%).
- $\text{Target} = 100\%$: If any prior class was missed ($\text{Total} - \text{Attended} > 0$), mathematically unreachable.
- Projected percentage after attending $X$ classes is computed and displayed for transparency.

---

## 9. Prerequisites

Before running the application, make sure you have:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes bundled with Node.js)
- **MongoDB**: A free MongoDB Atlas cluster OR local MongoDB instance running at `mongodb://localhost:27017`
- **Git**: Installed for version control

---

## 10. Installation & Setup

Clone the repository to your local system:

```bash
git clone https://github.com/your-username/student-attendance-management-system.git
cd student-attendance-management-system
```

Install all dependencies across both client and server:

```bash
# Using the root script:
npm run install:all

# OR manually:
cd server && npm install
cd ../client && npm install
cd ..
```

---

## 11. MongoDB Atlas Configuration

If you do not have a local MongoDB daemon installed, you can use MongoDB Atlas (Free Tier):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. Create a new Shared Cluster (**M0 Free Tier**).
3. Under **Security > Database Access**:
   - Create a database user (e.g. username: `admin_user`, password: `<your-password>`).
   - Assign the **Read and write to any database** privilege.
4. Under **Security > Network Access**:
   - Click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) for local development.
5. Under **Deployment > Database**:
   - Click **Connect** > **Drivers** > Select `Node.js`.
   - Copy the connection string:
     ```
     mongodb+srv://admin_user:<password>@cluster0.mongodb.net/attendance_db?retryWrites=true&w=majority
     ```
6. Paste this URI into `server/.env` under `MONGODB_URI`.

---

## 12. Environment Variables

### Backend Configuration (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Ensure the values match your local or cloud setup:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://admin_user:<password>@cluster0.mongodb.net/attendance_db?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_attendance_system_2026_dev
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
FRONTEND_URL=http://localhost:5173

# Initial Administrator Credentials (used during seed/setup)
INITIAL_ADMIN_NAME=System Administrator
INITIAL_ADMIN_EMAIL=admin@attendance.edu
INITIAL_ADMIN_PASSWORD=Admin@123456
```

### Frontend Configuration (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

```env
# Proxy path during development:
VITE_API_URL=/api
VITE_INSTITUTION_NAME="Apex Institute of Technology"
```

---

## 13. Database Seeding

Populate the database with realistic sample data including an initial Administrator, 4 Faculty members, 5 Subjects, 4 Classes, 18 Students, and 14 days of realistic lecture attendance logs:

```bash
# From workspace root:
npm run seed

# OR directly in the server folder:
cd server
npm run seed
```

### Pre-Configured Test Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@attendance.edu` | `Admin@123456` | Full administrative access |
| **Faculty (CS)** | `robert.miller@attendance.edu` | `Faculty@123` | Assigned to CS401 & CS403 |
| **Faculty (CS)** | `anita.sharma@attendance.edu` | `Faculty@123` | Assigned to CS402 & CS403 |
| **Student (Normal)** | `alex.j@attendance.edu` | `Student@123` | Roll No: `CS2026001` (~90% attendance) |
| **Student (Low %)** | `daniel.b@attendance.edu` | `Student@123` | Roll No: `CS2026004` (~60% attendance, triggers alert) |

*(Note: On the login page, click any of the 4 demo preset buttons to automatically log in!)*

---

## 14. Running the Application Locally

You can run both backend and frontend simultaneously:

### Terminal 1: Backend Server

```bash
cd server
npm run dev
```
Server starts on: `http://localhost:5000`

### Terminal 2: Frontend Client

```bash
cd client
npm run dev
```
Frontend starts on: `http://localhost:5173`

Open your browser and navigate to `http://localhost:5173`.

---

## 15. Running Automated Tests

The backend includes a comprehensive automated test suite powered by **Jest**, **Supertest**, and **MongoMemoryServer**. Tests run in an isolated in-memory MongoDB instance without touching your live database.

```bash
cd server
npm test
```

### Test Coverage Highlights:
- **Authentication:** Valid logins, password verification, generic credential error responses.
- **Authorization:** Role guards (Admin, Faculty, Student), forbidden route rejections (HTTP 403).
- **Student CRUD:** Roll number uniqueness validation, enrollment, and cascade cleanup.
- **Attendance Engine:** Bulk marking, compound index duplicate prevention `(student + subject + date)`.
- **Target Calculator:** Accurate target percentage solving, 100% impossibility checks, and zero-lecture edge cases.

```
PASS tests/api.test.js
PASS tests/calculator.test.js

Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
Snapshots:   0 total
```

---

## 16. REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates user, returns JWT and sets HTTP cookie |
| `POST` | `/api/auth/logout` | Private | Clears session cookie and invalidates state |
| `GET` | `/api/auth/me` | Private | Returns authenticated user details and role profile |
| `POST` | `/api/auth/change-password` | Private | Updates password after verifying current password |

### Students (`/api/students`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Admin, Faculty | List students with search, filters & pagination |
| `GET` | `/api/students/:id` | Private | Get single student record (self or admin/faculty) |
| `POST` | `/api/students` | Admin | Enroll new student and create user account |
| `PUT` | `/api/students/:id` | Admin | Update student academic info and user profile |
| `DELETE` | `/api/students/:id` | Admin | Safely delete student and associated records |

### Faculty (`/api/faculty`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/faculty` | Admin | List all faculty members |
| `GET` | `/api/faculty/:id` | Admin, Faculty | Get single faculty details and assignments |
| `POST` | `/api/faculty` | Admin | Register faculty and assign courses |
| `PUT` | `/api/faculty/:id` | Admin | Update faculty info, assignments, or active status |
| `DELETE` | `/api/faculty/:id` | Admin | Deactivate or remove faculty account |

### Subjects & Classes (`/api/subjects`, `/api/classes`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/subjects` | Private | List subjects filtered by department/semester |
| `POST` | `/api/subjects` | Admin | Create new subject curriculum course |
| `GET` | `/api/classes` | Private | List all academic classes and sections |
| `POST` | `/api/classes` | Admin | Create academic class section |

### Attendance (`/api/attendance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/attendance` | Admin, Faculty | Record single student attendance entry |
| `POST` | `/api/attendance/bulk` | Admin, Faculty | Bulk submit attendance for an entire class roster |
| `GET` | `/api/attendance` | Private | Query attendance logs by class, subject, date |
| `GET` | `/api/attendance/student/:id` | Private | Authoritative attendance percentage & breakdown |
| `PUT` | `/api/attendance/:id` | Admin, Faculty | Edit attendance record within permitted window |
| `GET` | `/api/attendance/target-calculator` | Private | Calculate required classes for a target percentage |

### Reports & Analytics (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/attendance` | Admin, Faculty | Filtered attendance audit report |
| `GET` | `/api/reports/low-attendance` | Admin, Faculty | List students below minimum threshold (e.g. 75%) |
| `GET` | `/api/reports/daily-summary` | Admin, Faculty | Breakdown of daily attendance counts |
| `GET` | `/api/reports/export-csv` | Admin, Faculty | Generates and downloads full CSV spreadsheet |

---

## 17. Security Architecture

- **Password Hashing:** Passwords are never stored in plain text. Salted with 10 rounds of `bcryptjs`.
- **Generic Error Responses:** Login returns `"Invalid email or password"` regardless of whether the user exists to prevent account enumeration.
- **Strict Role-Based Access Control (RBAC):** Backend endpoints verify `req.user.role` independently of frontend views.
- **Resource Ownership Verification:** Students can only inspect their own attendance records; attempting to query another student's ID returns HTTP 403.
- **Duplicate Prevention:** MongoDB compound unique index `{ studentId: 1, subjectId: 1, date: 1 }` guarantees mathematical integrity.
- **Rate Limiting:** Prevents brute-force authentication attacks on `/api/auth/login`.
- **Sanitized Headers:** Secured with `helmet` and restricted CORS whitelist.

---

## 18. Screenshots Section

Add screenshots of your running application to this section when preparing your GitHub portfolio:

### 1. Sign In Page
*Modern academic login portal with one-click demo account selectors.*

### 2. Administrator Dashboard
*KPI metrics, 7-day attendance trend area chart, and low-attendance watchlist.*

### 3. Student Management
*Student directory with search, filter by department/semester, and enrollment modal.*

### 4. Faculty Mark Attendance Form
*Roster view with Present, Absent, and Leave status buttons and bulk submission.*

### 5. Attendance Reports & CSV Export
*Multifaceted filtering interface with instant CSV spreadsheet generation.*

### 6. Student Dashboard & Target Calculator
*Course breakdown cards, low-attendance alert banner, and interactive target calculator modal.*

---

## 19. Deployment Guide

### A. Deploy Frontend to Vercel or Netlify
1. Push your repository to GitHub.
2. Link your repo in [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/).
3. Set **Root Directory** to `client`.
4. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Configure Environment Variables:
   - `VITE_API_URL`: Your deployed backend production URL (e.g. `https://sams-api.onrender.com/api`).

### B. Deploy Backend to Render
1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Set **Root Directory** to `server`.
4. Build settings:
   - Build command: `npm install`
   - Start command: `node server.js`
5. Add Environment Variables in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A strong 64-character random string.
   - `FRONTEND_URL`: Your deployed frontend URL (e.g. `https://sams.vercel.app`).

---

## 20. Future Enhancements

- **Biometric & RFID Scanner Integration:** Connect IoT hardware scanners directly to the bulk attendance endpoint.
- **Automated SMS & Email Alerts:** Send real-time notifications to parents when a student is marked absent.
- **QR-Code Dynamic Lecture Check-In:** Generate rotating time-limited QR codes projected in lecture halls for contactless attendance.
- **Semester Leave Applications:** Digital leave request workflow with approval by designated academic mentors.

---

## 21. License

This project is licensed under the [MIT License](LICENSE) - feel free to adapt and use it for academic and institutional projects.

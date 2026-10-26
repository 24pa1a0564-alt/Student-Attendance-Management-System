import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import {
  CalendarCheck2,
  Calendar,
  Layers,
  BookOpen,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  CheckCheck,
} from 'lucide-react';

const AttendanceMarking = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: { status, remarks } }
  const [search, setSearch] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  // Fetch classes and subjects allowed for this user
  useEffect(() => {
    const initData = async () => {
      try {
        if (user?.role === 'faculty') {
          // If faculty, fetch faculty profile with assigned classes & subjects
          const res = await api.get('/dashboard/faculty');
          if (res.data.success) {
            const fac = res.data.data;
            setClasses(fac.assignedClasses || []);
            setSubjects(fac.assignedSubjects || []);
            if (fac.assignedClasses?.length > 0) {
              setSelectedClassId(fac.assignedClasses[0]._id);
            }
            if (fac.assignedSubjects?.length > 0) {
              setSelectedSubjectId(fac.assignedSubjects[0]._id);
            }
          }
        } else {
          // If admin, fetch all classes and subjects
          const [clsRes, subRes] = await Promise.all([
            api.get('/classes'),
            api.get('/subjects'),
          ]);
          if (clsRes.data.success) {
            setClasses(clsRes.data.data);
            if (clsRes.data.data.length > 0) setSelectedClassId(clsRes.data.data[0]._id);
          }
          if (subRes.data.success) {
            setSubjects(subRes.data.data);
            if (subRes.data.data.length > 0) setSelectedSubjectId(subRes.data.data[0]._id);
          }
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to initialize attendance form', 'error');
      } finally {
        setLoadingInitial(false);
      }
    };

    initData();
  }, [user]);

  // When class, subject, or date changes, fetch students and any existing attendance for that date!
  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId || !attendanceDate) return;

    const loadStudentsAndExistingAttendance = async () => {
      setLoadingStudents(true);
      try {
        // 1. Fetch class details to get enrolled students
        const classRes = await api.get(`/classes/${selectedClassId}`);
        const enrolledStudents = classRes.data.data?.studentIds || [];
        setStudents(enrolledStudents);

        // 2. Fetch any already marked attendance for this class, subject, and date
        const attRes = await api.get('/attendance', {
          params: {
            classId: selectedClassId,
            subjectId: selectedSubjectId,
            date: attendanceDate,
          },
        });

        const initialMap = {};
        let foundExisting = false;

        // Populate existing or default to 'Present'
        enrolledStudents.forEach((student) => {
          const sId = student._id;
          const existingRecord = attRes.data.data?.find(
            (r) => r.studentId?._id === sId || r.studentId === sId
          );

          if (existingRecord) {
            foundExisting = true;
            initialMap[sId] = {
              status: existingRecord.status,
              remarks: existingRecord.remarks || '',
            };
          } else {
            // Default to Present
            initialMap[sId] = {
              status: 'Present',
              remarks: '',
            };
          }
        });

        setAttendanceMap(initialMap);
        setAlreadyMarked(foundExisting);
      } catch (err) {
        showToast('Error loading enrolled students', 'error');
      } finally {
        setLoadingStudents(false);
      }
    };

    loadStudentsAndExistingAttendance();
  }, [selectedClassId, selectedSubjectId, attendanceDate]);

  const setStatusForStudent = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        status,
      },
    }));
  };

  const setRemarksForStudent = (studentId, remarks) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        remarks,
      },
    }));
  };

  const markAll = (status) => {
    setAttendanceMap((prev) => {
      const updated = { ...prev };
      students.forEach((s) => {
        updated[s._id] = {
          ...(updated[s._id] || {}),
          status,
        };
      });
      return updated;
    });
    showToast(`Marked all students as ${status}`, 'info');
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedSubjectId || !attendanceDate) {
      showToast('Please select a class, subject, and date.', 'error');
      return;
    }

    if (students.length === 0) {
      showToast('No students enrolled in this class to mark attendance.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendanceMap[s._id]?.status || 'Present',
        remarks: attendanceMap[s._id]?.remarks || '',
      }));

      const res = await api.post('/attendance/bulk', {
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        date: attendanceDate,
        records,
      });

      if (res.data.success) {
        showToast(
          `Attendance successfully saved for ${records.length} students!`,
          'success'
        );
        setAlreadyMarked(true);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const name = s.userId?.name?.toLowerCase() || '';
    const roll = s.rollNumber?.toLowerCase() || '';
    return name.includes(q) || roll.includes(q);
  });

  // Calculate quick attendance counts from current form
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  students.forEach((s) => {
    const st = attendanceMap[s._id]?.status;
    if (st === 'Present') presentCount++;
    else if (st === 'Absent') absentCount++;
    else if (st === 'On Leave') leaveCount++;
  });

  if (loadingInitial) return <LoadingSpinner text="Setting up attendance session..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Mark Student Attendance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select subject, class section, and date to record or update student participation
          </p>
        </div>

        {alreadyMarked && (
          <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600" />
            Existing records loaded for this session
          </span>
        )}
      </div>

      {/* Selection Control Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Class Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Class / Section
            </label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.className} ({c.department} - Sem {c.semester})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.subjectCode} - {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attendance Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Quick Summary Pill Bar & Bulk Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Session Live Counts:</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              {presentCount} Present
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
              {absentCount} Absent
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              {leaveCount} On Leave
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => markAll('Present')}
              className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors"
            >
              Mark All Present
            </button>
            <button
              type="button"
              onClick={() => markAll('Absent')}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Student List & Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Search Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student by name or roll number..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filteredStudents.length} Students in roster
          </span>
        </div>

        {loadingStudents ? (
          <LoadingSpinner text="Loading enrolled students for this class..." />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            message="No students enrolled in this class or none match your search."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Remarks (Optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((st, idx) => {
                  const currentStatus = attendanceMap[st._id]?.status || 'Present';
                  const currentRemarks = attendanceMap[st._id]?.remarks || '';

                  return (
                    <tr key={st._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                        {st.rollNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{st.userId?.name || 'Student'}</p>
                        <p className="text-[11px] text-slate-400">{st.userId?.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(st._id, 'Present')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
                              currentStatus === 'Present'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/30'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Present
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(st._id, 'Absent')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
                              currentStatus === 'Absent'
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/30'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Absent
                          </button>

                          {/* On Leave Button */}
                          <button
                            type="button"
                            onClick={() => setStatusForStudent(st._id, 'On Leave')}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 border ${
                              currentStatus === 'On Leave'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Leave
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={currentRemarks}
                          onChange={(e) => setRemarksForStudent(st._id, e.target.value)}
                          placeholder="e.g. Late by 10 mins"
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Submit Attendance Footer Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Total of <span className="font-bold text-slate-800">{students.length} students</span> will be saved for{' '}
            <span className="font-bold text-indigo-600">{attendanceDate}</span>.
          </p>
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving || students.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Submitting Attendance...' : 'Save & Submit Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMarking;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const AttendanceReports = () => {
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyLowAttendance, setOnlyLowAttendance] = useState(false);

  const { showToast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (onlyLowAttendance) {
        const res = await api.get('/reports/low-attendance', {
          params: { department, semester },
        });
        if (res.data.success) {
          setRecords(res.data.data);
        }
      } else {
        const res = await api.get('/reports/attendance', {
          params: {
            department,
            semester,
            section,
            subjectId,
            startDate,
            endDate,
          },
        });
        if (res.data.success) {
          setRecords(res.data.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch attendance reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const subRes = await api.get('/subjects');
        if (subRes.data.success) setSubjects(subRes.data.data);
      } catch (err) {}
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [department, semester, section, subjectId, startDate, endDate, onlyLowAttendance]);

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/reports/export-csv', {
        params: {
          department,
          semester,
          section,
          subjectId,
          startDate,
          endDate,
        },
        responseType: 'blob',
      });

      // Create download link in browser
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      showToast('Attendance report exported successfully to CSV!', 'success');
    } catch (err) {
      showToast('Failed to export CSV report', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const resetFilters = () => {
    setDepartment('');
    setSemester('');
    setSection('');
    setSubjectId('');
    setStartDate('');
    setEndDate('');
    setOnlyLowAttendance(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Attendance Reports & Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit student attendance across classes, detect compliance risks, and export spreadsheets
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={downloading || records.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Exporting...' : 'Export as CSV'}
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filter Options
            </h3>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Section</label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value.toUpperCase())}
              placeholder="e.g. A"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={onlyLowAttendance}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.subjectCode}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={onlyLowAttendance}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={onlyLowAttendance}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Low Attendance Toggle Chip */}
        <div className="pt-2 flex items-center">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              checked={onlyLowAttendance}
              onChange={(e) => setOnlyLowAttendance(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              Show Only Students with Low Attendance (&lt; 75%)
            </span>
          </label>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Generating report..." />
        ) : records.length === 0 ? (
          <EmptyState
            title="No records found"
            message="No attendance logs matching your active filters. Try expanding the date range."
          />
        ) : onlyLowAttendance ? (
          /* Low Attendance Student Report Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Attended / Total</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Shortfall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {st.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{st.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {st.department} (Sem {st.semester})
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700">
                      {st.classesAttended} / {st.totalClassesHeld}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {st.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      -{st.shortfall}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Detailed Individual Attendance Logs Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(rec.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      {rec.studentId?.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {rec.studentId?.userId?.name || 'Student'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {rec.subjectId?.subjectCode} - {rec.subjectId?.subjectName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rec.classId?.className || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 italic">
                      {rec.remarks || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;

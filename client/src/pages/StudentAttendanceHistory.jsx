import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { History, Filter, Search, RotateCcw, Calendar } from 'lucide-react';

const StudentAttendanceHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showToast } = useToast();

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance', {
        params: {
          status,
          startDate,
          endDate,
        },
      });
      if (res.data.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch attendance history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [status, startDate, endDate]);

  const resetFilters = () => {
    setStatus('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Attendance History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete record of your daily class attendance logs, leaves, and absences
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Attendance Statuses</option>
            <option value="Present">Present Only</option>
            <option value="Absent">Absent Only</option>
            <option value="On Leave">On Leave Only</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="From Date"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="To Date"
            />
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors self-end sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching attendance records..." />
        ) : history.length === 0 ? (
          <EmptyState
            title="No attendance records found"
            message="No records match your active status or date filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {history.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {new Date(rec.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">
                        {rec.subjectId?.subjectCode} - {rec.subjectId?.subjectName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rec.classId?.className || 'General'}
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

export default StudentAttendanceHistory;

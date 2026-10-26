import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  BookOpen,
  Layers,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const FacultyDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const res = await api.get('/dashboard/faculty');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch faculty metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Faculty Dashboard..." />;

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
        {error}
      </div>
    );
  }

  const { faculty, todaySummary, assignedClasses, assignedSubjects, subjectStats, recentSessions } =
    data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/10 inline-block mb-3">
            Faculty Teaching Workspace &bull; {faculty?.employeeId}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Academic Attendance Hub
          </h2>
          <p className="mt-2 text-blue-200 text-xs sm:text-sm leading-relaxed">
            Record lecture participation, view class rosters, and verify attendance records for your assigned subjects and sections in {faculty?.department}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/attendance/mark"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm"
            >
              <CalendarCheck2 className="w-4 h-4" />
              Mark Attendance Today
            </Link>
            <Link
              to="/reports/attendance"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-colors border border-white/20"
            >
              View Class Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Classes"
          value={faculty?.assignedClassesCount || 0}
          subtitle="Class cohorts"
          icon={Layers}
          color="indigo"
        />
        <StatsCard
          title="Assigned Subjects"
          value={faculty?.assignedSubjectsCount || 0}
          subtitle="Course curricula"
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Enrolled Students"
          value={faculty?.totalStudents || 0}
          subtitle="Under your teaching"
          icon={Users}
          color="emerald"
        />
        <StatsCard
          title="Today Marked"
          value={`${todaySummary?.markedRecords || 0} logs`}
          subtitle={
            todaySummary?.markedRecords > 0
              ? `${todaySummary.percentage}% present rate`
              : 'No records marked today'
          }
          icon={CalendarCheck2}
          color={todaySummary?.markedRecords > 0 ? 'emerald' : 'amber'}
        />
      </div>

      {/* Assigned Subjects Overview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Assigned Courses & Attendance Rates</h3>
            <p className="text-xs text-slate-400">Aggregated attendance percentages across your active courses</p>
          </div>
          <Link
            to="/attendance/mark"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Mark Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectStats && subjectStats.length > 0 ? (
            subjectStats.map((sub) => (
              <div
                key={sub.subjectId}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                      {sub.subjectCode}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">Sem {sub.semester}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{sub.subjectName}</h4>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Classes Held</p>
                    <p className="text-sm font-bold text-slate-800">{sub.totalClassesHeld} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Attendance</p>
                    <p className="text-sm font-black text-indigo-600">{sub.percentage}%</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 col-span-3">No subjects assigned yet.</p>
          )}
        </div>
      </div>

      {/* Recent Marking Sessions Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Recent Attendance Marked</h3>
            <p className="text-xs text-slate-400">Recent attendance records submitted by you</p>
          </div>
          <Link to="/reports/attendance" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            View All Reports
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentSessions && recentSessions.length > 0 ? (
                recentSessions.map((rec) => (
                  <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(rec.date).toISOString().split('T')[0]}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-bold">
                      {rec.subjectId?.subjectCode} - {rec.subjectId?.subjectName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{rec.classId?.className}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic">{rec.remarks || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No recent attendance records marked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;

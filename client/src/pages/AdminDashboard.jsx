import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Percent,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  BookPlus,
  CalendarCheck2,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Administrator Dashboard..." />;

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
        {error}
      </div>
    );
  }

  const { summary, departmentStats, trendData, lowAttendanceList, recentActivity } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/10 inline-block mb-3">
            Administrator Command Center
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Institutional Attendance Overview
          </h2>
          <p className="mt-2 text-indigo-200 text-xs sm:text-sm leading-relaxed">
            Monitor real-time student participation, detect attendance shortfalls early, and streamline academic administration across all departments.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to="/admin/students"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Student
            </Link>
            <Link
              to="/admin/faculty"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 text-white font-semibold text-xs hover:bg-white/20 transition-colors border border-white/20"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Manage Faculty
            </Link>
            <Link
              to="/attendance/mark"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-colors shadow-sm"
            >
              <CalendarCheck2 className="w-3.5 h-3.5" />
              Mark Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={summary?.totalStudents || 0}
          subtitle="Enrolled Active"
          icon={Users}
          color="indigo"
          badge="Active"
        />
        <StatsCard
          title="Total Faculty"
          value={summary?.totalFaculty || 0}
          subtitle="Teaching Staff"
          icon={GraduationCap}
          color="blue"
        />
        <StatsCard
          title="Active Classes"
          value={summary?.totalClasses || 0}
          subtitle={`${summary?.totalSubjects || 0} Total Subjects`}
          icon={Layers}
          color="emerald"
        />
        <StatsCard
          title="Low Attendance Alert"
          value={summary?.lowAttendanceCount || 0}
          subtitle={`Below ${summary?.minimumAttendanceThreshold || 75}% threshold`}
          icon={AlertTriangle}
          color={summary?.lowAttendanceCount > 0 ? 'rose' : 'emerald'}
          badge="Action Required"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Past 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Attendance Trend (Past 7 Days)</h3>
              <p className="text-xs text-slate-400">Institutional daily average attendance %</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5" />
              Active Trend
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPerc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val}%`, 'Attendance']}
                />
                <Area
                  type="monotone"
                  dataKey="percentage"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPerc)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department-wise Breakdown Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Department Attendance</h3>
            <p className="text-xs text-slate-400 mb-4">Overall attendance percentage by department</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="department"
                    stroke="#94a3b8"
                    fontSize={9}
                    tickFormatter={(val) => val.split(' ')[0]}
                    tickLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1b4b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [`${val}%`, 'Attendance']}
                  />
                  <Bar dataKey="attendancePercentage" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <Link
            to="/reports/attendance"
            className="mt-3 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors pt-3 border-t border-slate-100"
          >
            <span>View Full Department Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Row: Low Attendance Watchlist & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Attendance Watchlist */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Low Attendance Watchlist</h3>
                <p className="text-xs text-slate-400">Students below {summary?.minimumAttendanceThreshold || 75}%</p>
              </div>
            </div>
            <Link
              to="/reports/attendance?filter=low"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View All ({summary?.lowAttendanceCount || 0})
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Student</th>
                  <th className="pb-3">Roll No</th>
                  <th className="pb-3">Dept</th>
                  <th className="pb-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {lowAttendanceList && lowAttendanceList.length > 0 ? (
                  lowAttendanceList.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 font-bold text-slate-800">{st.name}</td>
                      <td className="py-2.5 text-slate-500 font-mono">{st.rollNumber}</td>
                      <td className="py-2.5 text-slate-600">{st.department}</td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {st.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No students currently below the minimum threshold. Great job!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Attendance Activity */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Recent Attendance Sessions</h3>
                <p className="text-xs text-slate-400">Latest submissions by faculty</p>
              </div>
            </div>
            <Link to="/reports/attendance" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
              Audit Log
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-600 shadow-sm">
                      {item.subjectId?.subjectCode?.substring(0, 2) || 'CS'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {item.studentId?.userId?.name || 'Student'} ({item.studentId?.rollNumber})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.subjectId?.subjectName || 'Subject'} &bull; Marked by {item.markedBy?.name || 'Faculty'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-center py-6 text-slate-400">No recent activity recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

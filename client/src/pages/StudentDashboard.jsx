import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import TargetCalculatorModal from '../components/TargetCalculatorModal';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calculator,
  History,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Target Calculator modal state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcInitialAttended, setCalcInitialAttended] = useState(0);
  const [calcInitialTotal, setCalcInitialTotal] = useState(0);
  const [calcSubjectName, setCalcSubjectName] = useState('Overall Attendance');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await api.get('/dashboard/student');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Student Dashboard..." />;

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
        {error}
      </div>
    );
  }

  const { profile, settings, overall, subjectCards, targetProjections, recentHistory } =
    data || {};

  const openCalculator = (attended, total, name) => {
    setCalcInitialAttended(attended);
    setCalcInitialTotal(total);
    setCalcSubjectName(name);
    setIsCalcOpen(true);
  };

  const chartData = subjectCards?.map((sub) => ({
    name: sub.subjectCode,
    percentage: sub.percentage,
    attended: sub.classesAttended,
    total: sub.totalClassesHeld,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Low Attendance Warning Alert if below threshold */}
      {overall?.isLowAttendance && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Low Attendance Warning ({overall.percentage}%)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Your cumulative attendance is below the mandatory institutional threshold of{' '}
                <span className="font-bold">{settings?.minimumAttendanceThreshold}%</span>. You risk exam debarment.
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              openCalculator(overall.classesAttended, overall.totalClassesHeld, 'Overall Attendance')
            }
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors whitespace-nowrap self-stretch sm:self-auto text-center"
          >
            Calculate Required Classes
          </button>
        </div>
      )}

      {/* Student Welcome Header Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {profile?.rollNumber}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {profile?.department} &bull; Section {profile?.section}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Welcome back, {profile?.name}!
            </h2>
            <p className="mt-2 text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Semester {profile?.semester} &bull; Academic Year {profile?.academicYear}. Track your class participation, check subject thresholds, and project future attendance targets.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center gap-5 shrink-0">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                Overall Attendance
              </p>
              <h3 className="text-3xl sm:text-4xl font-black text-white mt-0.5">
                {overall?.percentage}%
              </h3>
              <p className="text-[11px] text-slate-300 mt-1">
                {overall?.classesAttended} attended of {overall?.totalClassesHeld} held
              </p>
            </div>
            <button
              onClick={() =>
                openCalculator(
                  overall?.classesAttended,
                  overall?.totalClassesHeld,
                  'Overall Attendance'
                )
              }
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/40"
              title="Open Target Calculator"
            >
              <Calculator className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Classes Attended"
          value={overall?.classesAttended || 0}
          subtitle="Present mark logs"
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Classes Missed"
          value={overall?.classesAbsent || 0}
          subtitle="Absent mark logs"
          icon={XCircle}
          color="rose"
        />
        <StatsCard
          title="Leaves Approved"
          value={overall?.classesOnLeave || 0}
          subtitle="Medical / official leave"
          icon={CalendarCheck2}
          color="amber"
        />
        <StatsCard
          title="Min Threshold"
          value={`${settings?.minimumAttendanceThreshold || 75}%`}
          subtitle={
            overall?.percentage >= (settings?.minimumAttendanceThreshold || 75)
              ? 'Status: Safe'
              : 'Status: At Risk'
          }
          icon={Percent}
          color={
            overall?.percentage >= (settings?.minimumAttendanceThreshold || 75)
              ? 'indigo'
              : 'rose'
          }
        />
      </div>

      {/* Subject-Wise Attendance Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Subject-Wise Attendance Breakdown</h3>
            <p className="text-xs text-slate-400">Accurate calculations per individual curriculum course</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjectCards && subjectCards.length > 0 ? (
            subjectCards.map((sub) => (
              <div
                key={sub.subjectId}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm card-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-indigo-600 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100">
                        {sub.subjectCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                        {sub.subjectName}
                      </h4>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-black border ${
                        sub.isLowAttendance
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Attended / Held:</span>
                      <span className="font-bold text-slate-800">
                        {sub.classesAttended} / {sub.totalClassesHeld} classes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Absent count:</span>
                      <span className="font-semibold text-rose-600">{sub.classesAbsent}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() =>
                      openCalculator(sub.classesAttended, sub.totalClassesHeld, sub.subjectName)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Target Calculator
                  </button>

                  <Link
                    to="/student/history"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    History <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 col-span-3">No subjects enrolled.</p>
          )}
        </div>
      </div>

      {/* Target Projections Preview & Subject Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Comparison Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Subject Attendance Comparison</h3>
            <p className="text-xs text-slate-400 mb-4">Visual percentage across subjects</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
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
                  <Bar dataKey="percentage" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Minimum required threshold: {settings?.minimumAttendanceThreshold}%</span>
          </div>
        </div>

        {/* Pre-Calculated Target Advice Cards */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Target Attendance Projections</h3>
                <p className="text-xs text-slate-400">Pre-evaluated target recommendations</p>
              </div>
              <button
                onClick={() =>
                  openCalculator(
                    overall?.classesAttended,
                    overall?.totalClassesHeld,
                    'Overall Attendance'
                  )
                }
                className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Custom Target"
              >
                <Calculator className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Target 75% Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Target 75% Attendance</span>
                  <span className="text-xs font-extrabold text-indigo-600">
                    +{targetProjections?.target75?.requiredClasses || 0} classes
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {targetProjections?.target75?.message}
                </p>
              </div>

              {/* Target 85% Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Target 85% Attendance</span>
                  <span className="text-xs font-extrabold text-indigo-600">
                    +{targetProjections?.target85?.requiredClasses || 0} classes
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {targetProjections?.target85?.message}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              openCalculator(overall?.classesAttended, overall?.totalClassesHeld, 'Overall Attendance')
            }
            className="w-full mt-4 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            Launch Interactive Target Calculator
          </button>
        </div>
      </div>

      {/* Target Calculator Modal */}
      <TargetCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        initialAttended={calcInitialAttended}
        initialTotal={calcInitialTotal}
        subjectName={calcSubjectName}
      />
    </div>
  );
};

export default StudentDashboard;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  BookOpen,
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const loggedInUser = await login(email, password);
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');

      if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedInUser.role === 'faculty') {
        navigate('/faculty/dashboard');
      } else if (loggedInUser.role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Apex Institute of Technology
        </h2>
        <p className="mt-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Student Attendance Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Sign in to your account</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your institutional credentials to access your portal.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
              {errorMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@attendance.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin@attendance.edu', 'Admin@123456')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/60 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-bold text-purple-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">admin@attendance.edu</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('robert.miller@attendance.edu', 'Faculty@123')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/60 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-bold text-blue-700">
                  <UserCheck className="w-3.5 h-3.5" />
                  Faculty
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">robert.miller@...</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('alex.j@attendance.edu', 'Student@123')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/60 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <BookOpen className="w-3.5 h-3.5" />
                  Student (Normal)
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">alex.j@attendance.edu</p>
              </button>

              <button
                type="button"
                onClick={() => fillDemoCredentials('daniel.b@attendance.edu', 'Student@123')}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/60 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-700">
                  <BookOpen className="w-3.5 h-3.5" />
                  Student (Low %)
                </div>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">daniel.b@attendance.edu</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Protected by JWT authentication and role-based access control.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

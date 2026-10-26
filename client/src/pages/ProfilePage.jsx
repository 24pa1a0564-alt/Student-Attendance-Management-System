import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Key,
  GraduationCap,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setProfileData(res.data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <LoadingSpinner text="Loading profile details..." />;

  const userData = profileData?.user || user;
  const roleProfile = profileData?.profile;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          My Account Profile
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          View your registered personal credentials and institutional academic profile
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-600/30">
              {userData?.name ? userData.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{userData?.name}</h3>
              <p className="text-xs text-slate-500">{userData?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {userData?.role}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Account
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/change-password"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Key className="w-4 h-4 text-slate-500" />
            Change Password
          </Link>
        </div>

        {/* Academic Details Section (if Student or Faculty) */}
        {userData?.role === 'student' && roleProfile && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Academic Enrollment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Roll Number</p>
                <p className="text-sm font-mono font-bold text-indigo-600 mt-1">
                  {roleProfile.rollNumber}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Department</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{roleProfile.department}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Section / Sem</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  Sec {roleProfile.section} (Sem {roleProfile.semester})
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Academic Year</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{roleProfile.academicYear}</p>
              </div>
            </div>
          </div>
        )}

        {userData?.role === 'faculty' && roleProfile && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Faculty Teaching Profile
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Employee ID</p>
                <p className="text-sm font-mono font-bold text-indigo-600 mt-1">
                  {roleProfile.employeeId}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Department</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{roleProfile.department}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Assigned Subjects</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {roleProfile.assignedSubjects?.length || 0} Courses
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security & Access Notice */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Member since {new Date(userData?.createdAt || Date.now()).toLocaleDateString()}</span>
          <span>Role privileges: {userData?.role?.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  FileSpreadsheet,
  Layers,
  History,
  User,
  Key,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/students', label: 'Students', icon: Users },
          { to: '/admin/faculty', label: 'Faculty', icon: GraduationCap },
          { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
          { to: '/admin/classes', label: 'Classes', icon: Layers },
          { to: '/attendance/mark', label: 'Mark Attendance', icon: CalendarCheck2 },
          { to: '/reports/attendance', label: 'Reports & CSV', icon: FileSpreadsheet },
        ];
      case 'faculty':
        return [
          { to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { to: '/attendance/mark', label: 'Mark Attendance', icon: CalendarCheck2 },
          { to: '/reports/attendance', label: 'Attendance Reports', icon: FileSpreadsheet },
        ];
      case 'student':
        return [
          { to: '/student/dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { to: '/student/history', label: 'Attendance History', icon: History },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-wider uppercase block">
                EduAttend
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest block">
                {user?.role} Portal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Menu Navigation
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          <div className="px-3 pt-6 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Account Settings
          </div>
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            <User className="w-4 h-4 shrink-0" />
            <span>My Profile</span>
          </NavLink>
          <NavLink
            to="/change-password"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`
            }
          >
            <Key className="w-4 h-4 shrink-0" />
            <span>Change Password</span>
          </NavLink>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
          <p className="font-semibold text-slate-400">Student Attendance System</p>
          <p className="mt-0.5">Version 1.0.0 &bull; MERN Stack</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

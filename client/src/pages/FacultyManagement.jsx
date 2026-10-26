import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  GraduationCap,
  BookOpen,
  Layers,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Faculty@123',
    employeeId: '',
    department: 'Computer Science',
    assignedSubjects: [],
    assignedClasses: [],
    isActive: true,
  });

  const { showToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, subRes, clsRes] = await Promise.all([
        api.get('/faculty', { params: { search, department } }),
        api.get('/subjects'),
        api.get('/classes'),
      ]);
      if (facRes.data.success) setFaculty(facRes.data.data);
      if (subRes.data.success) setSubjects(subRes.data.data);
      if (clsRes.data.success) setClasses(clsRes.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch faculty list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, department]);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/faculty', formData);
      if (res.data.success) {
        showToast('Faculty member registered successfully!', 'success');
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          email: '',
          password: 'Faculty@123',
          employeeId: '',
          department: 'Computer Science',
          assignedSubjects: [],
          assignedClasses: [],
          isActive: true,
        });
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create faculty member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFaculty = async (e) => {
    e.preventDefault();
    if (!selectedFaculty) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/faculty/${selectedFaculty._id}`, formData);
      if (res.data.success) {
        showToast('Faculty record updated successfully!', 'success');
        setIsEditModalOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update faculty', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/faculty/${selectedFaculty._id}`);
      if (res.data.success) {
        showToast('Faculty member removed successfully', 'success');
        setIsDeleteOpen(false);
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove faculty', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (f) => {
    setSelectedFaculty(f);
    setFormData({
      name: f.userId?.name || '',
      email: f.userId?.email || '',
      employeeId: f.employeeId || '',
      department: f.department || 'Computer Science',
      assignedSubjects: f.assignedSubjects?.map((s) => s._id) || [],
      assignedClasses: f.assignedClasses?.map((c) => c._id) || [],
      isActive: f.userId?.isActive ?? true,
    });
    setIsEditModalOpen(true);
  };

  const toggleSubject = (subId) => {
    setFormData((prev) => {
      const exists = prev.assignedSubjects.includes(subId);
      return {
        ...prev,
        assignedSubjects: exists
          ? prev.assignedSubjects.filter((id) => id !== subId)
          : [...prev.assignedSubjects, subId],
      };
    });
  };

  const toggleClass = (clsId) => {
    setFormData((prev) => {
      const exists = prev.assignedClasses.includes(clsId);
      return {
        ...prev,
        assignedClasses: exists
          ? prev.assignedClasses.filter((id) => id !== clsId)
          : [...prev.assignedClasses, clsId],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Faculty Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage academic instructors, course assignments, and class permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by faculty name, employee ID, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Electronics">Electronics</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Mechanical">Mechanical</option>
        </select>
      </div>

      {/* Faculty Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Loading faculty directory..." />
      ) : faculty.length === 0 ? (
        <EmptyState
          title="No faculty members found"
          message="No instructors match the search filters. Click Add Faculty to register an instructor."
          action={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Add Faculty
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculty.map((f) => (
            <div
              key={f._id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-sm shadow-sm">
                      {f.userId?.name ? f.userId.name.charAt(0).toUpperCase() : 'F'}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {f.userId?.name || 'Faculty'}
                      </h3>
                      <p className="text-[11px] font-mono text-indigo-600 mt-0.5">{f.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(f)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFaculty(f);
                        setIsDeleteOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-medium truncate max-w-[180px]">{f.userId?.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold text-slate-800">{f.department}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Account Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        f.userId?.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {f.userId?.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Assigned Courses / Classes Pills */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Assigned Subjects ({f.assignedSubjects?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.assignedSubjects && f.assignedSubjects.length > 0 ? (
                      f.assignedSubjects.map((sub) => (
                        <span
                          key={sub._id}
                          className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold"
                        >
                          {sub.subjectCode}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No subjects assigned yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Faculty Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Faculty Member"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Dr. John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="john.smith@attendance.edu"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                placeholder="FAC201"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Assign Subjects */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assign Subjects
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 space-y-1">
              {subjects.map((sub) => (
                <label
                  key={sub._id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedSubjects.includes(sub._id)}
                    onChange={() => toggleSubject(sub._id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-700">{sub.subjectCode}</span>
                  <span className="text-slate-500">{sub.subjectName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assign Classes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assign Classes
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 space-y-1">
              {classes.map((c) => (
                <label
                  key={c._id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedClasses.includes(c._id)}
                    onChange={() => toggleClass(c._id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-700">{c.className}</span>
                  <span className="text-slate-500">
                    ({c.department} - Sem {c.semester})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Faculty Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Faculty Member"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleEditFaculty} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID</label>
              <input
                type="text"
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
          </div>

          {/* Account Status toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Account Active (Allowed to log in and mark attendance)</span>
            </label>
          </div>

          {/* Assign Subjects */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assigned Subjects
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 space-y-1">
              {subjects.map((sub) => (
                <label
                  key={sub._id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedSubjects.includes(sub._id)}
                    onChange={() => toggleSubject(sub._id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-700">{sub.subjectCode}</span>
                  <span className="text-slate-500">{sub.subjectName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assign Classes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Assigned Classes
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-xl border border-slate-200 space-y-1">
              {classes.map((c) => (
                <label
                  key={c._id}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={formData.assignedClasses.includes(c._id)}
                    onChange={() => toggleClass(c._id)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-bold text-slate-700">{c.className}</span>
                  <span className="text-slate-500">
                    ({c.department} - Sem {c.semester})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteFaculty}
        title="Remove Faculty Member"
        message={`Are you sure you want to remove ${selectedFaculty?.userId?.name || 'this instructor'} (${selectedFaculty?.employeeId})? This will deactivate their teaching account.`}
        confirmText="Confirm Remove"
        confirmVariant="danger"
        loading={submitting}
      />
    </div>
  );
};

export default FacultyManagement;

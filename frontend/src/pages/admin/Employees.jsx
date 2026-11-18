import React, { useState, useEffect } from 'react';
import { employeeService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users, UserPlus, Shield, Phone, Mail, Calendar, KeyRound,
  Edit, Trash2, Power, CheckCircle2, AlertCircle, PhoneCall
} from 'lucide-react';

export const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Call Centre Executive',
    daily_call_target: 100,
  });

  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getEmployees();
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await employeeService.createEmployee({
        ...formData,
        daily_call_target: parseInt(formData.daily_call_target) || 100,
      });
      setMessage('Employee account and login created successfully!');
      setIsAddOpen(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create employee');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await employeeService.updateEmployee(selectedEmp.id, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
        daily_call_target: parseInt(formData.daily_call_target) || 100,
      });
      setMessage('Employee details updated successfully!');
      setIsEditOpen(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update employee');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await employeeService.toggleStatus(id);
      fetchEmployees();
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      await employeeService.resetPassword(selectedEmp.id, newPassword);
      setMessage(`Password for ${selectedEmp.full_name} reset successfully!`);
      setIsPasswordOpen(false);
      setNewPassword('');
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee? This will remove their user account and unassign their leads.')) {
      try {
        await employeeService.deleteEmployee(id);
        fetchEmployees();
      } catch (err) {
        alert('Failed to delete employee');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Employee Directory & Access Control</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage call centre employees, daily call targets, credentials, and account activation.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              full_name: '',
              email: '',
              password: 'Staff@123',
              phone: '',
              role: 'Call Centre Executive',
              daily_call_target: 100,
            });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Add New Employee
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {message}
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-4">Contact & Login</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Daily Target</th>
                <th className="py-3.5 px-4">Today's Calls</th>
                <th className="py-3.5 px-4">Assigned Leads</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-10 text-slate-400">
                    Loading employees...
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{emp.employee_code}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{emp.full_name}</p>
                      <p className="text-[10px] text-slate-400">Joined: {emp.joining_date}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-slate-400" /> {emp.email}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" /> {emp.phone || 'N/A'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{emp.role}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={emp.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-700">
                      {emp.daily_call_target} calls/day
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{emp.calls_completed_today}</span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({Math.round((emp.calls_completed_today / emp.daily_call_target) * 100)}%)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{emp.assigned_leads_count}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setSelectedEmp(emp);
                            setFormData({
                              full_name: emp.full_name,
                              email: emp.email,
                              phone: emp.phone || '',
                              role: emp.role,
                              daily_call_target: emp.daily_call_target,
                            });
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                          title="Edit Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEmp(emp);
                            setNewPassword('');
                            setIsPasswordOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp.id)}
                          className={`p-1.5 rounded-lg ${
                            emp.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Employee Account"
        subtitle="Generates user credentials and call centre profile"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="Aarav Sharma"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Login Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="aarav@crm.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Initial Password *</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="+91 98000 00000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Designation / Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Daily Call Target</label>
              <input
                type="number"
                value={formData.daily_call_target}
                onChange={(e) => setFormData({ ...formData, daily_call_target: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={selectedEmp ? `Edit ${selectedEmp.full_name}` : 'Edit Employee'}
        subtitle="Update employee profile and daily calling targets"
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Daily Call Target (Calls / Day)</label>
            <input
              type="number"
              value={formData.daily_call_target}
              onChange={(e) => setFormData({ ...formData, daily_call_target: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        title={selectedEmp ? `Reset Password for ${selectedEmp.full_name}` : 'Reset Password'}
        subtitle="Set a new secure password for this employee"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">New Password *</label>
            <input
              type="text"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 6 characters"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsPasswordOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

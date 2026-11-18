import React, { useState, useEffect } from 'react';
import { followUpService, employeeService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CalendarCheck, Clock, AlertTriangle, CheckCircle2,
  Calendar, Phone, User, Check, RefreshCw, ArrowRight
} from 'lucide-react';

export const AdminFollowUps = () => {
  const [tab, setTab] = useState('today'); // 'today', 'upcoming', 'overdue', 'completed'
  const [followups, setFollowups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Reschedule state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleRemarks, setRescheduleRemarks] = useState('');

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const [fRes, eRes] = await Promise.all([
        followUpService.getFollowUps({
          filter_type: tab,
          employee_id: employeeFilter ? parseInt(employeeFilter) : null,
        }),
        employeeService.getEmployees('ACTIVE'),
      ]);
      setFollowups(fRes.data);
      setEmployees(eRes.data);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [tab, employeeFilter]);

  const handleMarkCompleted = async (id) => {
    try {
      await followUpService.markCompleted(id);
      fetchFollowUps();
    } catch (err) {
      alert('Failed to mark follow-up completed');
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!newDate) return;

    try {
      await followUpService.reschedule(selectedFollowup.id, {
        scheduled_date: newDate,
        scheduled_time: newTime || null,
        remarks: rescheduleRemarks,
      });
      setIsRescheduleOpen(false);
      fetchFollowUps();
    } catch (err) {
      alert('Failed to reschedule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Follow-up Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, reassign, and reschedule timely customer interactions across all employees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchFollowUps}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        {[
          { key: 'today', label: "Today's Due", icon: Clock },
          { key: 'upcoming', label: 'Upcoming', icon: Calendar },
          { key: 'overdue', label: 'Overdue Shortfall', icon: AlertTriangle },
          { key: 'completed', label: 'Completed History', icon: CheckCircle2 },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                active
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Scheduled Date & Time</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Assigned Employee</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Remarks & Purpose</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Loading follow-up records...
                  </td>
                </tr>
              ) : followups.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No follow-ups in this queue.
                  </td>
                </tr>
              ) : (
                followups.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      <p>{f.scheduled_date}</p>
                      <p className="text-[11px] text-slate-400 font-sans">{f.scheduled_time || 'Anytime'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.customer_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{f.customer_phone}</td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{f.employee_name}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={f.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{f.remarks || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      {f.status !== 'COMPLETED' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleMarkCompleted(f.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Done
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFollowup(f);
                              setNewDate(f.scheduled_date);
                              setNewTime(f.scheduled_time || '');
                              setRescheduleRemarks('');
                              setIsRescheduleOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title={selectedFollowup ? `Reschedule Callback for ${selectedFollowup.customer_name}` : 'Reschedule'}
        subtitle="Select a new date and time for customer contact"
      >
        <form onSubmit={handleReschedule} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">New Date *</label>
              <input
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">New Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Reschedule Reason / Remarks</label>
            <textarea
              rows="2"
              value={rescheduleRemarks}
              onChange={(e) => setRescheduleRemarks(e.target.value)}
              placeholder="Customer was in meeting; requested evening callback..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { distributionService, leadService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import {
  SendHorizontal, Users, CheckSquare, Square, RefreshCw,
  Sparkles, CheckCircle2, AlertCircle, History, Clock
} from 'lucide-react';

export const AdminDistribution = () => {
  const [allocations, setAllocations] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [unassignedLeads, setUnassignedLeads] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [manualEmployeeId, setManualEmployeeId] = useState('');
  const [notes, setNotes] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, leadsRes, histRes] = await Promise.all([
        distributionService.getAllocations(),
        leadService.getLeads({ status: 'NEW' }),
        distributionService.getRecentHistory(),
      ]);

      setAllocations(allocRes.data.allocations);
      setUnassignedCount(allocRes.data.unassigned_leads_count);
      setUnassignedLeads(leadsRes.data);
      setHistory(histRes.data);

      // Default select all active employees for balanced distribute
      setSelectedEmployeeIds(allocRes.data.allocations.map((a) => a.employee_id));
    } catch (err) {
      console.error('Failed to load distribution data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleLeadSelect = (id) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === unassignedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(unassignedLeads.map((l) => l.id));
    }
  };

  const toggleEmployeeSelect = (id) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleManualAssign = async () => {
    if (selectedLeadIds.length === 0) {
      setError('Please select at least one customer lead to assign.');
      return;
    }
    if (!manualEmployeeId) {
      setError('Please select an employee to receive the leads.');
      return;
    }

    setError('');
    setMessage('');

    try {
      const res = await distributionService.assignLeads(
        selectedLeadIds,
        parseInt(manualEmployeeId),
        notes || 'Manual admin distribution'
      );
      setMessage(res.data.message);
      setSelectedLeadIds([]);
      setNotes('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleBalancedDistribute = async () => {
    if (selectedLeadIds.length === 0) {
      setError('Please select at least one customer lead to distribute.');
      return;
    }
    if (selectedEmployeeIds.length === 0) {
      setError('Please select at least one active employee for distribution.');
      return;
    }

    setError('');
    setMessage('');

    try {
      const res = await distributionService.balancedDistribute(
        selectedLeadIds,
        selectedEmployeeIds,
        notes || 'Smart balanced distribution'
      );
      setMessage(res.data.message);
      setSelectedLeadIds([]);
      setNotes('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Balanced distribution failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Morning Lead Distribution Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Equitably allocate incoming leads among call centre employees every morning.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
          {unassignedCount} Unassigned Leads Ready
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600" /> {error}
        </div>
      )}

      {/* Current Employee Allocations Grid */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-600" /> Active Employee Workloads & Allocation Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {allocations.map((emp) => {
            const isSelected = selectedEmployeeIds.includes(emp.employee_id);
            return (
              <div
                key={emp.employee_id}
                onClick={() => toggleEmployeeSelect(emp.employee_id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-500'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-500 font-bold">{emp.employee_code}</span>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300" />
                  )}
                </div>
                <p className="font-bold text-xs text-slate-900 truncate">{emp.full_name}</p>
                <div className="mt-2 text-[11px] space-y-0.5 text-slate-600">
                  <p>Assigned Leads: <span className="font-bold text-slate-900">{emp.total_assigned_leads}</span></p>
                  <p>Daily Target: <span className="font-semibold text-teal-700">{emp.daily_call_target} calls</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workspace: Leads Selection & Distribution Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Leads Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSelectAllLeads}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1.5"
              >
                {selectedLeadIds.length === unassignedLeads.length && unassignedLeads.length > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All ({unassignedLeads.length})
              </button>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600">
                {selectedLeadIds.length} Selected
              </span>
            </div>
            <button
              onClick={fetchData}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/50 sticky top-0 border-b border-slate-100 text-slate-500 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Loan Amount</th>
                  <th className="py-2.5 px-3">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unassignedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      No unassigned leads found. All customer leads are distributed!
                    </td>
                  </tr>
                ) : (
                  unassignedLeads.map((lead) => {
                    const isChecked = selectedLeadIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => toggleLeadSelect(lead.id)}
                        className={`cursor-pointer transition-colors ${
                          isChecked ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-teal-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{lead.full_name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{lead.phone_number}</td>
                        <td className="py-2.5 px-3 text-slate-500">{lead.city || '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          ₹{Number(lead.required_loan_amount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-teal-600">{lead.loan_type?.replace('_', ' ')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel (1 Col) */}
        <div className="space-y-4">
          {/* Smart Balanced Distribute Card */}
          <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-xs bg-gradient-to-br from-white to-teal-50/40">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-teal-600" /> Smart Balanced Distribution
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Evenly divides selected leads among all {selectedEmployeeIds.length} checked active staff members, balancing existing lead loads.
            </p>

            <button
              onClick={handleBalancedDistribute}
              disabled={selectedLeadIds.length === 0 || selectedEmployeeIds.length === 0}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <SendHorizontal className="w-4 h-4" /> Distribute {selectedLeadIds.length} Leads Evenly
            </button>
          </div>

          {/* Manual Single Assignment Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Manual Single Assign</h4>
            <p className="text-xs text-slate-500 mb-3">
              Assign all {selectedLeadIds.length} selected leads to a specific employee.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Employee</label>
                <select
                  value={manualEmployeeId}
                  onChange={(e) => setManualEmployeeId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-teal-500"
                >
                  <option value="">Select Employee</option>
                  {allocations.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Priority high-value leads"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={handleManualAssign}
                disabled={selectedLeadIds.length === 0 || !manualEmployeeId}
                className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50"
              >
                Assign to Selected Employee
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment History */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" /> Recent Lead Assignment Log
        </h3>
        <div className="overflow-x-auto max-h-56 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                <th className="py-2.5 px-3">Lead ID</th>
                <th className="py-2.5 px-3">Assigned To</th>
                <th className="py-2.5 px-3">Assigned By</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.slice(0, 15).map((h) => (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-slate-500">#{h.lead_id}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{h.assigned_to_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{h.assigned_by_name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{new Date(h.assigned_at).toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500 italic">{h.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

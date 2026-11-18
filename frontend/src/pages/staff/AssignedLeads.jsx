import React, { useState, useEffect } from 'react';
import { leadService, callService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users, Phone, PhoneCall, Search, Calendar, Clock,
  CheckCircle2, RefreshCw, Eye, MessageSquare, AlertCircle
} from 'lucide-react';

export const StaffAssignedLeads = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Log Call Modal
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [callOutcome, setCallOutcome] = useState('INTERESTED');
  const [remarks, setRemarks] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00');
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Customer Detail Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [leadDetails, setLeadDetails] = useState(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadService.getLeads({
        search: search || null,
        status: statusFilter || null,
      });
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to load assigned leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const openLogCallModal = (lead) => {
    setSelectedLead(lead);
    setCallOutcome('INTERESTED');
    setRemarks('');
    setNextFollowUpDate('');
    setNextFollowUpTime('11:00');
    setIsCallModalOpen(true);
  };

  const handleLogCall = async (e) => {
    e.preventDefault();
    setCallSubmitting(true);
    try {
      await callService.logCall({
        lead_id: selectedLead.id,
        outcome: callOutcome,
        remarks: remarks || `Customer contacted: ${callOutcome}`,
        next_follow_up_date: nextFollowUpDate || null,
        next_follow_up_time: nextFollowUpTime ? `${nextFollowUpTime}:00` : null,
      });

      setSuccessMsg(`Call logged for ${selectedLead.full_name}! Daily completed count incremented.`);
      setIsCallModalOpen(false);
      fetchLeads();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to log call');
    } finally {
      setCallSubmitting(false);
    }
  };

  const openDetails = async (lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
    try {
      const res = await leadService.getLead(lead.id);
      setLeadDetails(res.data);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Assigned Customer Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dial customers, introduce loan schemes, and log outcomes. Each call counts towards your 100-call target.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold">
          {leads.length} Customers Assigned
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {successMsg}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search assigned leads by customer name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
            <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
            <option value="APPLICATION_PROCESSING">APPLICATION_PROCESSING</option>
          </select>

          <button onClick={fetchLeads} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Phone (Click-to-Call)</th>
                <th className="py-3.5 px-4">City / Employment</th>
                <th className="py-3.5 px-4">Required Loan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Quick Dial & Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Loading your assigned queue...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    No leads assigned in this status.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{lead.customer_code}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{lead.full_name}</p>
                      <p className="text-[10px] text-slate-400">Source: {lead.lead_source}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {/* Click-to-call link using device dialer */}
                      <a
                        href={`tel:${lead.phone_number}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-mono font-bold transition-colors"
                        title="Click to dial customer on device"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        {lead.phone_number}
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{lead.city || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400">{lead.employment_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">₹{Number(lead.required_loan_amount).toLocaleString()}</p>
                      <p className="text-[10px] text-teal-600">{lead.loan_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={lead.lead_status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openDetails(lead)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="View History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openLogCallModal(lead)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Log Call
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

      {/* Log Call Modal */}
      <Modal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title={selectedLead ? `Log Call: ${selectedLead.full_name}` : 'Log Call'}
        subtitle="Records call record and automatically updates daily call count"
      >
        <form onSubmit={handleLogCall} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500">Customer Phone: <span className="font-mono font-bold text-slate-900">{selectedLead?.phone_number}</span></p>
            <p className="text-slate-500">Loan Inquiry: <span className="font-semibold text-slate-800">{selectedLead?.loan_type?.replace('_', ' ')} (₹{Number(selectedLead?.required_loan_amount || 0).toLocaleString()})</span></p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Call Outcome *</label>
            <select
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold text-slate-800"
            >
              <option value="INTERESTED">INTERESTED (Customer is keen on loan)</option>
              <option value="NOT_INTERESTED">NOT_INTERESTED (Customer declined)</option>
              <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED (Requires Callback)</option>
              <option value="CALL_BACK_LATER">CALL_BACK_LATER (Busy / Travelling)</option>
              <option value="NO_ANSWER">NO_ANSWER (Ringing no response)</option>
              <option value="BUSY">BUSY (Line engaged)</option>
              <option value="WRONG_NUMBER">WRONG_NUMBER (Incorrect contact)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Call Notes & Remarks</label>
            <textarea
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Explained HDFC Platinum Home loan 8.5% scheme. Customer interested in 25 year tenure..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          {/* Conditional Next Follow-up Date/Time */}
          {['INTERESTED', 'FOLLOW_UP_REQUIRED', 'CALL_BACK_LATER', 'BUSY', 'NO_ANSWER'].includes(callOutcome) && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <p className="font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Schedule Next Follow-up (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-950">Follow-up Date</label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-950">Follow-up Time</label>
                  <input
                    type="time"
                    value={nextFollowUpTime}
                    onChange={(e) => setNextFollowUpTime(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCallModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={callSubmitting}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              {callSubmitting ? 'Saving Call Record...' : 'Submit & Count Call'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedLead ? `${selectedLead.full_name} (${selectedLead.customer_code})` : 'Customer History'}
        subtitle="Interaction history and documents"
        maxWidth="max-w-2xl"
      >
        {leadDetails ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 border border-slate-200">
              <p><span className="text-slate-400">Phone:</span> <span className="font-mono font-bold text-slate-900">{leadDetails.lead.phone_number}</span></p>
              <p><span className="text-slate-400">Email:</span> {leadDetails.lead.email || '-'}</p>
              <p><span className="text-slate-400">Address:</span> {leadDetails.lead.address || '-'}</p>
              <p><span className="text-slate-400">Status:</span> <Badge status={leadDetails.lead.lead_status} /></p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2">Previous Call Logs ({leadDetails.calls.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {leadDetails.calls.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-lg border border-slate-100 bg-white">
                    <div className="flex justify-between items-center">
                      <Badge status={c.outcome} />
                      <span className="text-[10px] text-slate-400">{c.call_date} {c.call_time}</span>
                    </div>
                    {c.remarks && <p className="text-slate-600 mt-1">{c.remarks}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">Loading...</div>
        )}
      </Modal>
    </div>
  );
};

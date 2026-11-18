import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CheckCircle2, XCircle, DollarSign, Lock, RefreshCw,
  Calendar, Check, AlertCircle, FileText
} from 'lucide-react';

export const AdminApprovals = () => {
  const [applications, setApplications] = useState([]);
  const [tab, setTab] = useState('under_review'); // 'under_review', 'approved', 'rejected', 'disbursed', 'closed'
  const [loading, setLoading] = useState(true);

  // Action Modals
  const [selectedApp, setSelectedApp] = useState(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  // Form states
  const [approvedAmount, setApprovedAmount] = useState('');
  const [approvalDate, setApprovalDate] = useState(new Date().toISOString().split('T')[0]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [disbursedAmount, setDisbursedAmount] = useState('');
  const [disbursementDate, setDisbursementDate] = useState(new Date().toISOString().split('T')[0]);
  const [closureRemarks, setClosureRemarks] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getApplications();
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      await applicationService.approve(selectedApp.id, {
        approved_amount: parseFloat(approvedAmount),
        approval_date: approvalDate,
        remarks: 'Approved by Admin operations',
      });
      setIsApproveOpen(false);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason) return;
    try {
      await applicationService.reject(selectedApp.id, {
        rejection_reason: rejectionReason,
        remarks: 'Declined by Admin',
      });
      setIsRejectOpen(false);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Rejection failed');
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    try {
      await applicationService.disburse(selectedApp.id, {
        disbursed_amount: parseFloat(disbursedAmount),
        disbursement_date: disbursementDate,
        remarks: 'Disbursed to customer bank account',
      });
      setIsDisburseOpen(false);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Disbursement failed');
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    try {
      await applicationService.close(selectedApp.id, {
        remarks: closureRemarks || 'File closed and archived',
      });
      setIsCloseOpen(false);
      fetchApplications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Closure failed');
    }
  };

  // Filter applications by tab
  const filteredApps = applications.filter((a) => {
    if (tab === 'under_review') {
      return ['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED'].includes(a.status);
    }
    if (tab === 'approved') return a.status === 'APPROVED';
    if (tab === 'rejected') return a.status === 'REJECTED';
    if (tab === 'disbursed') return a.status === 'DISBURSED';
    if (tab === 'closed') return a.status === 'CLOSED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Loan Approval & Disbursement Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin operations for granting sanction letters, logging rejections, and recording bank disbursements.
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { key: 'under_review', label: 'Under Review Queue' },
          { key: 'approved', label: 'Approved (Sanctioned)' },
          { key: 'disbursed', label: 'Disbursed (Success)' },
          { key: 'rejected', label: 'Rejected Files' },
          { key: 'closed', label: 'Closed & Archived' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">App Number</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Bank & Scheme</th>
                <th className="py-3.5 px-4">Requested (₹)</th>
                <th className="py-3.5 px-4">Approved (₹)</th>
                <th className="py-3.5 px-4">Disbursed (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No applications in this approval stage.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{app.application_number}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{app.customer_name}</p>
                      <p className="font-mono text-[11px] text-slate-400">{app.customer_phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{app.bank_name}</p>
                      <p className="text-[11px] text-slate-500">{app.scheme_name}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Number(app.requested_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {app.approved_amount ? `₹${Number(app.approved_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-700">
                      {app.disbursed_amount ? `₹${Number(app.disbursed_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* If in review -> can approve or reject */}
                        {['SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_DOCUMENTS_REQUIRED'].includes(app.status) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setApprovedAmount(app.requested_amount.toString());
                                setIsApproveOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setRejectionReason('');
                                setIsRejectOpen(true);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}

                        {/* If approved -> can disburse */}
                        {app.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setDisbursedAmount((app.approved_amount || app.requested_amount).toString());
                              setIsDisburseOpen(true);
                            }}
                            className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1 shadow-xs"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Record Disbursement
                          </button>
                        )}

                        {/* If disbursed -> can mark closed */}
                        {app.status === 'DISBURSED' && (
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setClosureRemarks('');
                              setIsCloseOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" /> Close File
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title={selectedApp ? `Approve Loan for ${selectedApp.customer_name}` : 'Approve Loan'}
        subtitle="Issue official sanction and update lead status to APPROVED"
      >
        <form onSubmit={handleApprove} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Approved Loan Amount (₹) *</label>
            <input
              type="number"
              required
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Approval Sanction Date *</label>
            <input
              type="date"
              required
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsApproveOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
            >
              Confirm Approval
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={selectedApp ? `Reject Application ${selectedApp.application_number}` : 'Reject Loan'}
        subtitle="Document official lender decline reason"
      >
        <form onSubmit={handleReject} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Rejection Reason *</label>
            <textarea
              rows="3"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. CIBIL score below bank threshold or insufficient debt-service ratio..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* Disburse Modal */}
      <Modal
        isOpen={isDisburseOpen}
        onClose={() => setIsDisburseOpen(false)}
        title={selectedApp ? `Disburse Loan ${selectedApp.application_number}` : 'Record Disbursement'}
        subtitle="Record funds transfer date and actual disbursed amount"
      >
        <form onSubmit={handleDisburse} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Disbursed Amount (₹) *</label>
            <input
              type="number"
              required
              value={disbursedAmount}
              onChange={(e) => setDisbursedAmount(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Disbursement Date *</label>
            <input
              type="date"
              required
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsDisburseOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs"
            >
              Confirm Disbursement
            </button>
          </div>
        </form>
      </Modal>

      {/* Close File Modal */}
      <Modal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Mark Loan File Closed"
        subtitle="Archive application and seal record"
      >
        <form onSubmit={handleClose} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Closure Remarks</label>
            <textarea
              rows="2"
              value={closureRemarks}
              onChange={(e) => setClosureRemarks(e.target.value)}
              placeholder="All loan agreements executed and commission invoiced..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCloseOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xs"
            >
              Archive & Close
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

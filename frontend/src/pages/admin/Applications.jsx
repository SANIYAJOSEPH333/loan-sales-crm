import React, { useState, useEffect } from 'react';
import { applicationService, leadService, bankService, schemeService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  FileText, Plus, Eye, Edit, Clock, Building2, CheckCircle2,
  RefreshCw, History, ArrowRight
} from 'lucide-react';

export const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [banks, setBanks] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetails, setAppDetails] = useState(null);

  const [formData, setFormData] = useState({
    lead_id: '',
    bank_id: '',
    scheme_id: '',
    requested_amount: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, bankRes, schemeRes, leadRes] = await Promise.all([
        applicationService.getApplications({
          status: statusFilter || null,
          bank_id: bankFilter ? parseInt(bankFilter) : null,
        }),
        bankService.getBanks('ACTIVE'),
        schemeService.getSchemes({ status: 'ACTIVE' }),
        leadService.getLeads(),
      ]);
      setApplications(appRes.data);
      setBanks(bankRes.data);
      setSchemes(schemeRes.data);
      setLeads(leadRes.data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, bankFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await applicationService.createApplication({
        lead_id: parseInt(formData.lead_id),
        bank_id: parseInt(formData.bank_id),
        scheme_id: parseInt(formData.scheme_id),
        requested_amount: parseFloat(formData.requested_amount),
        remarks: formData.remarks,
      });
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create application');
    }
  };

  const openDetails = async (app) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
    try {
      const res = await applicationService.getApplication(app.id);
      setAppDetails(res.data);
    } catch (err) {
      console.error('Failed to load application details:', err);
    }
  };

  // Filter schemes when bank is selected
  const availableSchemes = formData.bank_id
    ? schemes.filter((s) => s.bank_id === parseInt(formData.bank_id))
    : schemes;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Loan Application Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track bank submissions, under-review underwriting, and approval milestones.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              lead_id: leads[0]?.id || '',
              bank_id: banks[0]?.id || '',
              scheme_id: schemes[0]?.id || '',
              requested_amount: 1500000,
              remarks: 'Customer submitted all preliminary documents',
            });
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Loan Application
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Application Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="ADDITIONAL_DOCUMENTS_REQUIRED">ADDITIONAL_DOCUMENTS_REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DISBURSED">DISBURSED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Banks</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bank_name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchData} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">App Number</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Bank & Scheme</th>
                <th className="py-3.5 px-4">Requested (₹)</th>
                <th className="py-3.5 px-4">Approved (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No loan applications found.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{app.application_number}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{app.customer_name}</p>
                      <p className="font-mono text-[11px] text-slate-500">{app.customer_phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{app.bank_name}</p>
                      <p className="text-[11px] text-slate-500">{app.scheme_name}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{Number(app.requested_amount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      {app.approved_amount ? `₹${Number(app.approved_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {app.assigned_employee_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openDetails(app)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 rounded-lg font-bold flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Application Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Loan Application"
        subtitle="Submit a customer profile into underwriting review"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Select Customer Lead *</label>
            <select
              required
              value={formData.lead_id}
              onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">Select Customer</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name} ({l.customer_code}) - {l.loan_type}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Partner Bank *</label>
              <select
                required
                value={formData.bank_id}
                onChange={(e) => setFormData({ ...formData, bank_id: e.target.value, scheme_id: '' })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Select Bank</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bank_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Loan Scheme *</label>
              <select
                required
                value={formData.scheme_id}
                onChange={(e) => setFormData({ ...formData, scheme_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="">Select Scheme</option>
                {availableSchemes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.scheme_name} ({s.interest_rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Requested Amount (₹) *</label>
            <input
              type="number"
              required
              value={formData.requested_amount}
              onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
              placeholder="1500000"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Initial Underwriting Remarks</label>
            <textarea
              rows="2"
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              placeholder="e.g. 780 CIBIL score, ITRs verified for 3 years..."
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
            >
              Submit Application
            </button>
          </div>
        </form>
      </Modal>

      {/* Application Details & History Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedApp ? `Application ${selectedApp.application_number}` : 'Application Details'}
        subtitle="Complete lifecycle history and audit logs"
        maxWidth="max-w-2xl"
      >
        {appDetails ? (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-bold">Customer</p>
                <p className="font-bold text-slate-800">{appDetails.application.customer_name}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-bold">Lender Bank</p>
                <p className="font-bold text-slate-800">{appDetails.application.bank_name}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-bold">Current Status</p>
                <Badge status={appDetails.application.status} />
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-bold">Requested Amount</p>
                <p className="font-bold text-slate-900">₹{Number(appDetails.application.requested_amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-bold">Approved Amount</p>
                <p className="font-extrabold text-emerald-700">
                  {appDetails.application.approved_amount ? `₹${Number(appDetails.application.approved_amount).toLocaleString()}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 uppercase text-[10px] font-bold">Disbursed Amount</p>
                <p className="font-extrabold text-teal-700">
                  {appDetails.application.disbursed_amount ? `₹${Number(appDetails.application.disbursed_amount).toLocaleString()}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-teal-600" /> Application Status Lifecycle
              </h4>
              <div className="space-y-2 border-l-2 border-teal-500 pl-4 ml-2">
                {appDetails.history.map((h) => (
                  <div key={h.id} className="relative pb-3 last:pb-0">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.status_to}</span>
                      <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{h.remarks}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Updated by: {h.changed_by_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">Loading details...</div>
        )}
      </Modal>
    </div>
  );
};

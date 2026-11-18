import React, { useState, useEffect } from 'react';
import { leadService, employeeService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Search, Filter, Plus, Edit, Trash2, Eye, Phone, Mail,
  MapPin, DollarSign, Calendar, RefreshCw, UserCheck
} from 'lucide-react';

export const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadDetails, setLeadDetails] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    address: '',
    city: '',
    employment_type: 'SALARIED',
    monthly_income: '',
    required_loan_amount: '',
    loan_type: 'PERSONAL_LOAN',
    lead_source: 'WEBSITE',
    assigned_employee_id: '',
  });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const [leadsRes, empRes] = await Promise.all([
        leadService.getLeads({ search, status: statusFilter, loan_type: loanTypeFilter }),
        employeeService.getEmployees('ACTIVE'),
      ]);
      setLeads(leadsRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, loanTypeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const openAddModal = () => {
    setFormData({
      full_name: '',
      phone_number: '',
      email: '',
      address: '',
      city: '',
      employment_type: 'SALARIED',
      monthly_income: '',
      required_loan_amount: '',
      loan_type: 'PERSONAL_LOAN',
      lead_source: 'WEBSITE',
      assigned_employee_id: '',
    });
    setIsAddOpen(true);
  };

  const parseAmount = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const openEditModal = (lead) => {
    setSelectedLead(lead);
    setFormData({
      full_name: lead.full_name || '',
      phone_number: lead.phone_number || '',
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      employment_type: lead.employment_type || 'SALARIED',
      monthly_income: lead.monthly_income != null ? lead.monthly_income : '',
      required_loan_amount: lead.required_loan_amount != null ? lead.required_loan_amount : '',
      loan_type: lead.loan_type || 'PERSONAL_LOAN',
      lead_source: lead.lead_source || 'WEBSITE',
      assigned_employee_id: lead.assigned_employee_id || '',
    });
    setIsEditOpen(true);
  };

  const openDetailModal = async (lead) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
    try {
      const res = await leadService.getLead(lead.id);
      setLeadDetails(res.data);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await leadService.createLead({
        ...formData,
        monthly_income: parseAmount(formData.monthly_income),
        required_loan_amount: parseAmount(formData.required_loan_amount),
        assigned_employee_id: formData.assigned_employee_id ? parseInt(formData.assigned_employee_id) : null,
      });
      setIsAddOpen(false);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create lead');
    }
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      await leadService.updateLead(selectedLead.id, {
        ...formData,
        monthly_income: parseAmount(formData.monthly_income),
        required_loan_amount: parseAmount(formData.required_loan_amount),
        assigned_employee_id: formData.assigned_employee_id ? parseInt(formData.assigned_employee_id) : null,
      });
      setIsEditOpen(false);
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update lead');
    }
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this customer lead?')) {
      try {
        await leadService.deleteLead(id);
        fetchLeads();
      } catch (err) {
        alert('Failed to delete lead');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Lead Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming inquiries, customer records, assignments, and statuses.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Lead
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, code, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-white"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
            <option value="DOCUMENTS_PENDING">DOCUMENTS_PENDING</option>
            <option value="APPLICATION_PROCESSING">APPLICATION_PROCESSING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DISBURSED">DISBURSED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <select
            value={loanTypeFilter}
            onChange={(e) => setLoanTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 focus:ring-teal-500"
          >
            <option value="">All Loan Types</option>
            <option value="HOME_LOAN">Home Loan</option>
            <option value="PERSONAL_LOAN">Personal Loan</option>
            <option value="BUSINESS_LOAN">Business Loan</option>
            <option value="VEHICLE_LOAN">Vehicle Loan</option>
            <option value="EDUCATION_LOAN">Education Loan</option>
          </select>

          <button
            onClick={fetchLeads}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
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
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">City / Employment</th>
                <th className="py-3.5 px-4">Loan Details</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No customer leads match the query.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                      {lead.customer_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{lead.full_name}</p>
                      <span className="text-[10px] text-slate-400">Source: {lead.lead_source}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" /> {lead.phone_number}
                      </p>
                      {lead.email && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-700 font-medium">{lead.city || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500">{lead.employment_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">
                        ₹{Number(lead.required_loan_amount).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-teal-600 font-medium">{lead.loan_type?.replace('_', ' ')}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={lead.lead_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {lead.assigned_employee_name ? (
                        <span className="text-slate-800 font-medium flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600" /> {lead.assigned_employee_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openDetailModal(lead)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(lead)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                          title="Edit Lead"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                          title="Delete Lead"
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

      {/* Add / Edit Lead Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Add New Customer Lead' : 'Edit Customer Lead'}
        subtitle="Fill in customer profile and financial criteria"
      >
        <form onSubmit={isAddOpen ? handleCreateLead : handleUpdateLead} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
                placeholder="Rohan Mehra"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
                placeholder="+91 98200 00000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
                placeholder="rohan@example.com"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
                placeholder="Mumbai"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Full Address</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
              placeholder="Flat 402, Sunshine Heights, Andheri..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Employment Type</label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
              >
                <option value="SALARIED">Salaried</option>
                <option value="SELF_EMPLOYED">Self Employed</option>
                <option value="BUSINESS">Business</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Monthly Income (₹)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
                placeholder="45000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Required Loan Amount (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.required_loan_amount}
                onChange={(e) => setFormData({ ...formData, required_loan_amount: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
                placeholder="500000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Loan Type</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
              >
                <option value="PERSONAL_LOAN">Personal Loan</option>
                <option value="HOME_LOAN">Home Loan</option>
                <option value="BUSINESS_LOAN">Business Loan</option>
                <option value="VEHICLE_LOAN">Vehicle Loan</option>
                <option value="EDUCATION_LOAN">Education Loan</option>
                <option value="GOLD_LOAN">Gold Loan</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Lead Source</label>
              <select
                value={formData.lead_source}
                onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
              >
                <option value="WEBSITE">Website</option>
                <option value="CALL_INQUIRY">Call Inquiry</option>
                <option value="REFERRAL">Referral</option>
                <option value="PARTNER_BANK">Partner Bank</option>
                <option value="CAMPAIGN">Campaign</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Assign to Employee</label>
              <select
                value={formData.assigned_employee_id}
                onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-teal-500 bg-white"
              >
                <option value="">Leave Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.employee_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs"
            >
              {isAddOpen ? 'Create Lead' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Customer Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setLeadDetails(null);
        }}
        title={selectedLead ? `${selectedLead.full_name} (${selectedLead.customer_code})` : 'Customer Details'}
        subtitle="360-degree overview: interactions, documents, and loan applications"
        maxWidth="max-w-3xl"
      >
        {leadDetails ? (
          <div className="space-y-6 text-xs">
            {/* Quick Profile Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Contact Phone</p>
                <p className="font-bold text-slate-800">{leadDetails.lead.phone_number}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Status</p>
                <Badge status={leadDetails.lead.lead_status} />
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Monthly Income</p>
                <p className="font-bold text-slate-800">₹{Number(leadDetails.lead.monthly_income).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Assigned Staff</p>
                <p className="font-bold text-teal-700">{leadDetails.lead.assigned_employee_name || 'Unassigned'}</p>
              </div>
            </div>

            {/* Interaction Call Logs */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Call Logs History ({leadDetails.calls.length})</h4>
              {leadDetails.calls.length === 0 ? (
                <p className="text-slate-400 italic">No calls recorded yet for this customer.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {leadDetails.calls.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg border border-slate-100 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{c.employee_name}</span>
                        <span className="text-[11px] text-slate-400">{c.call_date} {c.call_time}</span>
                      </div>
                      <Badge status={c.outcome} className="mt-1" />
                      {c.remarks && <p className="text-slate-600 mt-1">{c.remarks}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Documents */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Uploaded Documents ({leadDetails.documents.length})</h4>
              {leadDetails.documents.length === 0 ? (
                <p className="text-slate-400 italic">No documents uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {leadDetails.documents.map((d) => (
                    <div key={d.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{d.document_type}</p>
                        <p className="text-[10px] text-slate-500">{d.file_name}</p>
                      </div>
                      <Badge status={d.verification_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loan Applications */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Loan Applications ({leadDetails.applications.length})</h4>
              {leadDetails.applications.length === 0 ? (
                <p className="text-slate-400 italic">No loan applications filed yet.</p>
              ) : (
                <div className="space-y-2">
                  {leadDetails.applications.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-slate-900">{a.application_number}</p>
                        <p className="text-slate-600">{a.bank_name} • {a.scheme_name}</p>
                        <p className="text-slate-500">Requested: ₹{Number(a.requested_amount).toLocaleString()}</p>
                      </div>
                      <Badge status={a.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">Loading details...</div>
        )}
      </Modal>
    </div>
  );
};

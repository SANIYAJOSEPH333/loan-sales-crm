import React, { useState, useEffect } from 'react';
import { schemeService, bankService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Layers, Plus, Edit, Trash2, Building2, Percent,
  Calendar, RefreshCw, Filter
} from 'lucide-react';

export const AdminSchemes = () => {
  const [schemes, setSchemes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankFilter, setBankFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [formData, setFormData] = useState({
    bank_id: '',
    scheme_name: '',
    loan_type: 'HOME_LOAN',
    min_loan_amount: 100000,
    max_loan_amount: 10000000,
    interest_rate: 8.5,
    min_eligibility_criteria: '',
    loan_tenure: 'up to 20 years',
    processing_fee: '0.5% of loan amount',
    description: '',
    status: 'ACTIVE',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        schemeService.getSchemes({
          bank_id: bankFilter ? parseInt(bankFilter) : null,
          loan_type: typeFilter || null,
        }),
        bankService.getBanks('ACTIVE'),
      ]);
      setSchemes(sRes.data);
      setBanks(bRes.data);
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [bankFilter, typeFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await schemeService.createScheme({
        ...formData,
        bank_id: parseInt(formData.bank_id),
        min_loan_amount: parseFloat(formData.min_loan_amount),
        max_loan_amount: parseFloat(formData.max_loan_amount),
        interest_rate: parseFloat(formData.interest_rate),
      });
      setIsAddOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create scheme');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await schemeService.updateScheme(selectedScheme.id, {
        ...formData,
        bank_id: parseInt(formData.bank_id),
        min_loan_amount: parseFloat(formData.min_loan_amount),
        max_loan_amount: parseFloat(formData.max_loan_amount),
        interest_rate: parseFloat(formData.interest_rate),
      });
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update scheme');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this loan scheme?')) {
      try {
        await schemeService.deleteScheme(id);
        fetchData();
      } catch (err) {
        alert('Failed to delete scheme');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Loan Scheme Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure interest rates, tenures, eligibility criteria, and bank processing fees.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              bank_id: banks[0]?.id || '',
              scheme_name: '',
              loan_type: 'HOME_LOAN',
              min_loan_amount: 100000,
              max_loan_amount: 10000000,
              interest_rate: 8.5,
              min_eligibility_criteria: 'Min CIBIL 720, Salaried or Business with 2+ years vintage',
              loan_tenure: 'up to 20 years',
              processing_fee: '0.5%',
              description: '',
              status: 'ACTIVE',
            });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Loan Scheme
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Partner Banks</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bank_name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Loan Types</option>
            <option value="HOME_LOAN">Home Loan</option>
            <option value="PERSONAL_LOAN">Personal Loan</option>
            <option value="BUSINESS_LOAN">Business Loan</option>
            <option value="VEHICLE_LOAN">Vehicle Loan</option>
            <option value="EDUCATION_LOAN">Education Loan</option>
            <option value="GOLD_LOAN">Gold Loan</option>
          </select>
        </div>

        <button
          onClick={fetchData}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schemes.map((s) => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md uppercase">
                    {s.bank_name}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{s.scheme_name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{s.loan_type?.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-teal-700">{s.interest_rate}%</span>
                  <p className="text-[10px] text-slate-400 font-medium">p.a. onwards</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Loan Range:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(s.min_loan_amount).toLocaleString()} - ₹{Number(s.max_loan_amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tenure:</span>
                  <span className="font-semibold text-slate-800">{s.loan_tenure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Processing Fee:</span>
                  <span className="font-semibold text-slate-800">{s.processing_fee}</span>
                </div>
                {s.min_eligibility_criteria && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-2">
                    <span className="font-bold text-slate-700">Criteria:</span> {s.min_eligibility_criteria}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Badge status={s.status} />
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setSelectedScheme(s);
                    setFormData({
                      bank_id: s.bank_id,
                      scheme_name: s.scheme_name,
                      loan_type: s.loan_type,
                      min_loan_amount: s.min_loan_amount,
                      max_loan_amount: s.max_loan_amount,
                      interest_rate: s.interest_rate,
                      min_eligibility_criteria: s.min_eligibility_criteria || '',
                      loan_tenure: s.loan_tenure,
                      processing_fee: s.processing_fee,
                      description: s.description || '',
                      status: s.status,
                    });
                    setIsEditOpen(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                  title="Edit Scheme"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                  title="Delete Scheme"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Scheme Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Add Loan Scheme' : 'Edit Loan Scheme'}
        subtitle="Catalog interest rates and borrowing guidelines"
      >
        <form onSubmit={isAddOpen ? handleCreate : handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Partner Bank *</label>
              <select
                required
                value={formData.bank_id}
                onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
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
              <label className="block font-semibold text-slate-700">Scheme Name *</label>
              <input
                type="text"
                required
                value={formData.scheme_name}
                onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="Platinum Home Loan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Loan Type *</label>
              <select
                value={formData.loan_type}
                onChange={(e) => setFormData({ ...formData, loan_type: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="HOME_LOAN">Home Loan</option>
                <option value="PERSONAL_LOAN">Personal Loan</option>
                <option value="BUSINESS_LOAN">Business Loan</option>
                <option value="VEHICLE_LOAN">Vehicle Loan</option>
                <option value="EDUCATION_LOAN">Education Loan</option>
                <option value="GOLD_LOAN">Gold Loan</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Interest Rate (% p.a.) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-bold"
                placeholder="8.50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Min Amount (₹)</label>
              <input
                type="number"
                value={formData.min_loan_amount}
                onChange={(e) => setFormData({ ...formData, min_loan_amount: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Max Amount (₹)</label>
              <input
                type="number"
                value={formData.max_loan_amount}
                onChange={(e) => setFormData({ ...formData, max_loan_amount: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Loan Tenure</label>
              <input
                type="text"
                value={formData.loan_tenure}
                onChange={(e) => setFormData({ ...formData, loan_tenure: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="12 to 84 months"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Processing Fee</label>
              <input
                type="text"
                value={formData.processing_fee}
                onChange={(e) => setFormData({ ...formData, processing_fee: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="1% of loan amount"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Eligibility Criteria</label>
            <textarea
              rows="2"
              value={formData.min_eligibility_criteria}
              onChange={(e) => setFormData({ ...formData, min_eligibility_criteria: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(false);
                setIsEditOpen(false);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
            >
              {isAddOpen ? 'Add Scheme' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

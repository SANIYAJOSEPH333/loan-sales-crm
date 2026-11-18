import React, { useState, useEffect } from 'react';
import { bankService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Building2, Plus, Edit, Trash2, Phone, Mail, MapPin,
  RefreshCw, CheckCircle2, Layers
} from 'lucide-react';

export const AdminBanks = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);

  const [formData, setFormData] = useState({
    bank_name: '',
    bank_code: '',
    contact_person: '',
    contact_number: '',
    email: '',
    address: '',
    status: 'ACTIVE',
  });

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const res = await bankService.getBanks();
      setBanks(res.data);
    } catch (err) {
      console.error('Failed to load banks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await bankService.createBank(formData);
      setIsAddOpen(false);
      fetchBanks();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add bank');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await bankService.updateBank(selectedBank.id, formData);
      setIsEditOpen(false);
      fetchBanks();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update bank');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this bank? Associated loan schemes will also be removed.')) {
      try {
        await bankService.deleteBank(id);
        fetchBanks();
      } catch (err) {
        alert('Failed to delete bank');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Partner Bank Network</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain lender tie-ups, credit desk contacts, and institutional affiliations.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              bank_name: '',
              bank_code: '',
              contact_person: '',
              contact_number: '',
              email: '',
              address: '',
              status: 'ACTIVE',
            });
            setIsAddOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Partner Bank
        </button>
      </div>

      {/* Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks.map((b) => (
          <div
            key={b.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {b.bank_code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{b.bank_name}</h3>
                </div>
                <Badge status={b.status} />
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  Contact Desk: {b.contact_person || 'N/A'}
                </p>
                <p className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {b.contact_number || '-'}
                </p>
                <p className="flex items-center gap-1.5 text-[11px] truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {b.email || '-'}
                </p>
                <p className="flex items-start gap-1.5 text-[11px] text-slate-500 line-clamp-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> {b.address || '-'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-teal-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> {b.schemes_count} Active Schemes
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    setSelectedBank(b);
                    setFormData({
                      bank_name: b.bank_name,
                      bank_code: b.bank_code,
                      contact_person: b.contact_person || '',
                      contact_number: b.contact_number || '',
                      email: b.email || '',
                      address: b.address || '',
                      status: b.status,
                    });
                    setIsEditOpen(true);
                  }}
                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg"
                  title="Edit Bank"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                  title="Delete Bank"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Bank Modal */}
      <Modal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          setIsAddOpen(false);
          setIsEditOpen(false);
        }}
        title={isAddOpen ? 'Add Partner Bank' : 'Edit Bank Details'}
        subtitle="Manage financial intermediary tie-ups"
      >
        <form onSubmit={isAddOpen ? handleCreate : handleUpdate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Bank Name *</label>
              <input
                type="text"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="HDFC Bank"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Bank Code *</label>
              <input
                type="text"
                required
                value={formData.bank_code}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value.toUpperCase() })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                placeholder="HDFC"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="Senior Loan Officer"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Contact Number</label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="+91 22 0000 0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                placeholder="loans@bank.com"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Head Office Address</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
              placeholder="Tower A, Financial District..."
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
              {isAddOpen ? 'Add Bank' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

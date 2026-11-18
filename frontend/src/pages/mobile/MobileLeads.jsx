import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Search, Phone, RefreshCw, Filter } from 'lucide-react';

export const MobileLeads = () => {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await leadService.getLeads({ search, status: statusFilter || null });
      setLeads(res.data);
    } catch (err) {
      console.error('Failed to load leads:', err);
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

  return (
    <div className="space-y-3">
      {/* Search Header */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
          />
        </form>

        <div className="flex items-center justify-between gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 w-full"
          >
            <option value="">All Statuses ({leads.length})</option>
            <option value="NEW">NEW</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DISBURSED">DISBURSED</option>
          </select>
          <button onClick={fetchLeads} className="p-1.5 border border-slate-200 rounded-lg text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile Leads List Cards */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No leads found.</div>
        ) : (
          leads.map((l) => (
            <div key={l.id} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    {l.customer_code}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{l.full_name}</h4>
                  <p className="text-[11px] text-slate-500">{l.city || 'N/A'} • {l.loan_type?.replace(/_/g, ' ')}</p>
                </div>
                <Badge status={l.lead_status} />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Loan Amount</p>
                  <p className="font-extrabold text-slate-900">₹{Number(l.required_loan_amount).toLocaleString()}</p>
                </div>
                <a
                  href={`tel:${l.phone_number}`}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-mono font-bold flex items-center gap-1.5 text-xs"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

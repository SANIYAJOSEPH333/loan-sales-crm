import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import {
  Users, PhoneCall, CheckCircle2, Clock, FileCheck,
  TrendingUp, AlertTriangle, ArrowRight, DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MobileDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const res = await dashboardService.getAdminDashboard();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load mobile dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDash();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
        Loading Mobile Admin...
      </div>
    );
  }

  const { metrics, top_performers, under_target_employees, upcoming_followups } = data;
  const targetPct = metrics.total_daily_target > 0
    ? Math.round((metrics.calls_completed_today / metrics.total_daily_target) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Mobile Calling Target Hero Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-navy-900 to-slate-800 text-white shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-teal-400 tracking-wider">
            Today's Team Output
          </span>
          <span className="text-xs font-black text-emerald-400">{targetPct}% Reached</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{metrics.calls_completed_today}</h2>
            <p className="text-[11px] text-slate-300">calls completed out of {metrics.total_daily_target}</p>
          </div>
          <button
            onClick={() => navigate('/admin/mobile/targets')}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1"
          >
            Targets <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="mt-3 w-full bg-navy-950 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-teal-400 transition-all duration-500"
            style={{ width: `${Math.min(100, targetPct)}%` }}
          />
        </div>
      </div>

      {/* Quick Metrics Grid (2 columns on mobile) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={() => navigate('/admin/mobile/leads')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50"
        >
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[10px] font-bold text-slate-400">Total</span>
          </div>
          <p className="text-lg font-black text-slate-900">{metrics.total_leads}</p>
          <p className="text-[10px] text-slate-500">Customer Leads</p>
        </div>

        <div
          onClick={() => navigate('/admin/mobile/distribution')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold text-amber-600">Pending</span>
          </div>
          <p className="text-lg font-black text-slate-900">{metrics.pending_calls}</p>
          <p className="text-[10px] text-slate-500">Calls Pending Today</p>
        </div>

        <div
          onClick={() => navigate('/admin/mobile/documents')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50"
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <FileCheck className="w-4 h-4" />
            <span className="text-[10px] font-bold text-purple-600">Review</span>
          </div>
          <p className="text-lg font-black text-slate-900">{metrics.documents_pending}</p>
          <p className="text-[10px] text-slate-500">Docs Pending Verify</p>
        </div>

        <div
          onClick={() => navigate('/admin/mobile/approvals')}
          className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs cursor-pointer active:bg-slate-50"
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[10px] font-bold text-emerald-600">Sanctioned</span>
          </div>
          <p className="text-lg font-black text-slate-900">{metrics.approved_loans}</p>
          <p className="text-[10px] text-slate-500">Approved Loans</p>
        </div>
      </div>

      {/* Top Performers Mobile Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Top Call Centre Performers
          </span>
          <span className="text-[10px] text-slate-400">Target: 100</span>
        </h3>
        <div className="space-y-2">
          {top_performers.slice(0, 3).map((emp) => (
            <div key={emp.employee_id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
              <div>
                <p className="font-bold text-slate-800">{emp.name}</p>
                <p className="text-[10px] text-slate-400">{emp.code}</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                {emp.completed} calls
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Action Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 mb-3">Quick Mobile Admin Actions</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => navigate('/admin/mobile/distribution')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-left font-semibold text-slate-800 flex items-center justify-between"
          >
            <span>Assign Leads</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
          </button>
          <button
            onClick={() => navigate('/admin/mobile/approvals')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-left font-semibold text-slate-800 flex items-center justify-between"
          >
            <span>Loan Approvals</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
          </button>
          <button
            onClick={() => navigate('/admin/mobile/documents')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-left font-semibold text-slate-800 flex items-center justify-between"
          >
            <span>KYC Verification</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
          </button>
          <button
            onClick={() => navigate('/admin/mobile/reports')}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-left font-semibold text-slate-800 flex items-center justify-between"
          >
            <span>View Reports</span>
            <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

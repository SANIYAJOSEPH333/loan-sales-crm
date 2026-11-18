import React, { useState, useEffect } from 'react';
import { dashboardService, followUpService } from '../../services/crmServices';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users, PhoneCall, Clock, CheckCircle2, AlertTriangle,
  UploadCloud, FileText, Check, Phone
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export const StaffDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardService.getStaffDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCompleteFollowup = async (id) => {
    try {
      await followUpService.markCompleted(id);
      fetchDashboard();
    } catch (err) {
      alert('Failed to complete follow-up');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Loading Staff Workspace...
      </div>
    );
  }

  const { employee, metrics, charts, today_followups } = data;
  const isTargetAchieved = metrics.calls_completed_today >= metrics.daily_target;

  return (
    <div className="space-y-6">
      {/* Target Gauge Banner */}
      <div className="bg-gradient-to-r from-navy-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-navy-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-800">
              Welcome back, {employee.name} ({employee.code})
            </span>
            <h2 className="text-2xl font-black text-white mt-2">Today's Call Target Gauge</h2>
            <p className="text-xs text-slate-300 mt-1">
              {isTargetAchieved
                ? 'Congratulations! You have achieved your 100 daily call target!'
                : `You have completed ${metrics.calls_completed_today} calls. ${metrics.remaining_calls} calls remaining to meet your 100 call target.`}
            </p>
          </div>

          <div className="flex items-center space-x-6 bg-navy-950/70 p-4 rounded-xl border border-navy-800 shrink-0">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Calls Completed</p>
              <p className="text-3xl font-black text-teal-400">{metrics.calls_completed_today}</p>
            </div>
            <div className="h-10 w-px bg-navy-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Daily Target</p>
              <p className="text-3xl font-black text-white">{metrics.daily_target}</p>
            </div>
            <div className="h-10 w-px bg-navy-800" />
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Progress</p>
              <p className="text-3xl font-black text-emerald-400">{metrics.target_achievement_percentage}%</p>
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-5">
          <div className="w-full bg-navy-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-navy-800">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isTargetAchieved ? 'bg-emerald-400' : 'bg-teal-400'
              }`}
              style={{ width: `${Math.min(100, metrics.target_achievement_percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Leads"
          value={metrics.assigned_leads}
          subtext="In your active dialing queue"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Interested Customers"
          value={metrics.interested_customers}
          subtext={`${metrics.not_interested_customers} not interested`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Follow-ups Due Today"
          value={metrics.follow_ups_due_today}
          subtext={`${metrics.overdue_follow_ups} overdue`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Active Loan Files"
          value={metrics.active_applications}
          subtext={`${metrics.pending_documents} pending documents`}
          icon={FileText}
          color="teal"
        />
      </div>

      {/* 2-Column: 7-day Trend & Today's Pending Callbacks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal 7-day Dialing Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">My Calling Performance (Last 7 Days)</h3>
            <span className="text-xs text-slate-400">Target: 100 calls/day</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.call_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="calls" fill="#0D9488" name="Calls Logged" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#E2E8F0" name="Daily Target (100)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Follow-up Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Today's Callbacks ({today_followups.length})</h3>
            <span className="text-xs text-amber-600 font-semibold">Priority</span>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {today_followups.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No pending callbacks scheduled for today.</p>
            ) : (
              today_followups.map((f) => (
                <div key={f.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{f.customer_name}</p>
                    <a
                      href={`tel:${f.customer_phone}`}
                      className="text-[11px] font-mono text-teal-600 flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3 h-3" /> {f.customer_phone}
                    </a>
                    <p className="text-[10px] text-slate-400 mt-0.5">{f.scheduled_time} • {f.remarks || 'Follow-up'}</p>
                  </div>
                  <button
                    onClick={() => handleCompleteFollowup(f.id)}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold"
                    title="Mark Completed"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

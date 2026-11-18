import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/crmServices';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users, PhoneCall, CheckCircle2, Clock, FileCheck, DollarSign,
  TrendingUp, AlertTriangle, ShieldCheck, XCircle, ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#64748B'];

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await dashboardService.getAdminDashboard();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Loading Admin CRM Dashboard...
      </div>
    );
  }

  const { metrics, charts, top_performers, under_target_employees, recent_activities, upcoming_followups } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive CRM Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline metrics, call targets, and loan conversion performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            PostgreSQL Live Synchronized
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={metrics.total_leads}
          subtext={`${metrics.leads_assigned_today} assigned today`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Calls Completed Today"
          value={metrics.calls_completed_today}
          subtext={`Target: ${metrics.total_daily_target} total`}
          icon={PhoneCall}
          color="teal"
          trend={{ positive: true, text: 'Active dialing', label: 'today' }}
        />
        <StatCard
          title="Pending Calls Today"
          value={metrics.pending_calls}
          subtext="Across all staff"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Interested Customers"
          value={metrics.interested_customers}
          subtext={`${metrics.not_interested_customers} not interested`}
          icon={TrendingUp}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title="Follow-ups Due Today"
          value={metrics.follow_ups_due_today}
          subtext="Requires prompt staff callback"
          icon={Clock}
          color="indigo"
        />
        <StatCard
          title="Docs Pending Verification"
          value={metrics.documents_pending}
          subtext="Awaiting Admin Review"
          icon={FileCheck}
          color="purple"
        />
        <StatCard
          title="Approved Loans"
          value={metrics.approved_loans}
          subtext={`${metrics.loans_processing} under review`}
          icon={ShieldCheck}
          color="emerald"
        />
        <StatCard
          title="Disbursed Loans"
          value={metrics.disbursed_loans}
          subtext={`${metrics.rejected_loans} rejected`}
          icon={DollarSign}
          color="teal"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Call Performance Trend (7 Days) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Daily Call Performance (Last 7 Days)</h3>
            <span className="text-xs text-slate-400">Total calls recorded</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.daily_call_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="calls" fill="#0D9488" radius={[4, 4, 0, 0]} name="Completed Calls" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Lead Status Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.lead_status_distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {charts.lead_status_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee-wise Target Progress */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Today's Employee Call Targets vs Completed</h3>
            <p className="text-xs text-slate-500">Target of 100 calls per employee per day</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.employee_performance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="completed" fill="#14B8A6" name="Calls Completed" radius={[0, 4, 4, 0]} />
              <Bar dataKey="target" fill="#E2E8F0" name="Target (100)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Performing Staff
          </h3>
          <div className="space-y-3">
            {top_performers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Dialing in progress today</p>
            ) : (
              top_performers.map((emp) => (
                <div key={emp.employee_id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                    <p className="text-[11px] text-slate-500">{emp.code} • {emp.percentage}% of daily target</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    {emp.completed} calls
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shortfall Attention List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Target Shortfall Watchlist
          </h3>
          <div className="space-y-3">
            {under_target_employees.map((emp) => (
              <div key={emp.employee_id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                  <p className="text-[11px] text-slate-500">Remaining: {emp.remaining} calls to reach 100</p>
                </div>
                <div className="w-16 bg-slate-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, emp.percentage)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Activity Logs</h3>
          <div className="space-y-3">
            {recent_activities.slice(0, 5).map((act) => (
              <div key={act.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                    {act.action}
                  </span>
                  <span className="text-[10px] text-slate-400">{act.created_at}</span>
                </div>
                <p className="text-slate-600 mt-1 line-clamp-1">{act.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

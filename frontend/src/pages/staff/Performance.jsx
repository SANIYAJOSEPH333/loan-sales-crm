import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/crmServices';
import { StatCard } from '../../components/common/StatCard';
import {
  TrendingUp, PhoneCall, CheckCircle2, Clock,
  Calendar, Award, Target
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export const StaffPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await dashboardService.getStaffDashboard();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load performance:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPerf();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Loading personal analytics...
      </div>
    );
  }

  const { employee, metrics, charts } = data;
  const conversionRate = metrics.calls_completed_today > 0
    ? Math.round((metrics.interested_customers / metrics.calls_completed_today) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Personal Calling & Conversion Performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit your daily calling metrics, target fulfillment, and loan pipeline conversions.
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-bold flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-600" /> Executive Scorecard
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Daily Calls Completed"
          value={metrics.calls_completed_today}
          subtext={`Target: ${metrics.daily_target} calls`}
          icon={PhoneCall}
          color="teal"
        />
        <StatCard
          title="Target Attainment"
          value={`${metrics.target_achievement_percentage}%`}
          subtext={`${metrics.remaining_calls} calls to reach 100`}
          icon={Target}
          color="emerald"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtext={`${metrics.interested_customers} interested customers`}
          icon={TrendingUp}
          color="indigo"
        />
        <StatCard
          title="Active Loan Files"
          value={metrics.active_applications}
          subtext={`${metrics.pending_documents} pending KYC verification`}
          icon={CheckCircle2}
          color="blue"
        />
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">7-Day Daily Call Output vs 100-Call Target</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.call_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="calls" fill="#0D9488" name="Calls Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="#E2E8F0" name="Target (100)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

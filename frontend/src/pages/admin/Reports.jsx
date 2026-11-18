import React, { useState, useEffect } from 'react';
import { reportService, employeeService } from '../../services/crmServices';
import { StatCard } from '../../components/common/StatCard';
import {
  BarChart3, Download, Calendar, Filter, PhoneCall,
  Users, CheckCircle2, TrendingUp, RefreshCw, FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981'];

export const AdminReports = () => {
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [employeeId, setEmployeeId] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rRes, eRes] = await Promise.all([
        reportService.getSummary(startDate, endDate, employeeId ? parseInt(employeeId) : null),
        employeeService.getEmployees('ACTIVE'),
      ]);
      setData(rRes.data);
      setEmployees(eRes.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, employeeId]);

  const handleDownloadCsv = (type) => {
    window.open(`/api/reports/export/${type}?start_date=${startDate}&end_date=${endDate}`, '_blank');
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mr-3"></div>
        Generating CRM Reports from PostgreSQL...
      </div>
    );
  }

  const { calls_summary, leads_summary, loans_summary, employee_performance } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Business Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated conversion rates, call analytics, and CSV export records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('calls')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Download Calls CSV"
          >
            <Download className="w-3.5 h-3.5" /> Calls CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('leads')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
            title="Download Leads CSV"
          >
            <Download className="w-3.5 h-3.5" /> Leads CSV
          </button>
          <button
            onClick={() => handleDownloadCsv('loans')}
            className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
            title="Download Loans CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" /> Loans Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-mono"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white font-mono"
            />
          </div>

          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-700 font-medium"
          >
            <option value="">All Staff Members</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchReports} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls Dialed"
          value={calls_summary.total_calls}
          subtext={`${calls_summary.interested} interested (${
            calls_summary.total_calls > 0
              ? Math.round((calls_summary.interested / calls_summary.total_calls) * 100)
              : 0
          }% conversion)`}
          icon={PhoneCall}
          color="teal"
        />
        <StatCard
          title="Customer Leads in Range"
          value={leads_summary.total_leads}
          subtext="Inbound & distributed"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Applications Approved"
          value={loans_summary.approved}
          subtext={`${loans_summary.total_applications} total submitted`}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Total Disbursed Volume"
          value={`₹${(loans_summary.total_disbursed_amount / 100000).toFixed(1)} Lakhs`}
          subtext={`${loans_summary.disbursed} loans successfully funded`}
          icon={TrendingUp}
          color="indigo"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Outcomes Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Call Outcomes Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={calls_summary.outcomes_breakdown}
                  dataKey="count"
                  nameKey="outcome"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {calls_summary.outcomes_breakdown.map((entry, index) => (
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

        {/* Daily Dialing Trend */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Call Volume Trend Over Range</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calls_summary.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="calls" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Calls Made" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Performance Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Employee Performance & Conversion Breakdown</h3>
          <span className="text-xs text-slate-500">Based on calls logged in selected period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Total Calls</th>
                <th className="py-3 px-4">Interested Customers</th>
                <th className="py-3 px-4">Conversion Rate</th>
                <th className="py-3 px-4">Assigned Leads</th>
                <th className="py-3 px-4">Sanctioned Loans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employee_performance.map((emp) => (
                <tr key={emp.employee_id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">{emp.employee_code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{emp.total_calls}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">{emp.interested_calls}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-extrabold border border-teal-200">
                      {emp.conversion_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-semibold">{emp.assigned_leads}</td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">{emp.approved_loans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { employeeService, dashboardService } from '../../services/crmServices';
import {
  PhoneCall, TrendingUp, AlertTriangle, CheckCircle2,
  Edit2, Check, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export const AdminTargets = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [targetInput, setTargetInput] = useState('');

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getEmployees('ACTIVE');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleSaveTarget = async (id) => {
    const val = parseInt(targetInput);
    if (!val || val <= 0) return;
    try {
      await employeeService.updateTarget(id, val);
      setEditingId(null);
      fetchTargets();
    } catch (err) {
      alert('Failed to update target');
    }
  };

  const chartData = employees.map((emp) => ({
    name: emp.full_name,
    completed: emp.calls_completed_today,
    target: emp.daily_call_target,
    remaining: Math.max(0, emp.daily_call_target - emp.calls_completed_today),
  }));

  const totalTarget = employees.reduce((acc, e) => acc + e.daily_call_target, 0);
  const totalCompleted = employees.reduce((acc, e) => acc + e.calls_completed_today, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Daily Call Target & Performance Hub</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Default company target: 100 calls/day per employee. Monitor real-time attainment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-semibold">
            Company Attainment: <span className="font-extrabold">{overallPct}%</span> ({totalCompleted} / {totalTarget} calls)
          </div>
          <button
            onClick={fetchTargets}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparative Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Employee Calls Completed vs Target Today</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="completed" fill="#0D9488" name="Calls Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" fill="#E2E8F0" name="Daily Target" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Target Progress Cards for Each Employee */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const completed = emp.calls_completed_today;
          const target = emp.daily_call_target;
          const pct = Math.min(100, Math.round((completed / target) * 100));
          const remaining = Math.max(0, target - completed);
          const isDone = completed >= target;

          return (
            <div
              key={emp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{emp.employee_code}</span>
                    <h4 className="font-bold text-sm text-slate-900">{emp.full_name}</h4>
                  </div>
                  {isDone ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Target Met
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                      {remaining} remaining
                    </span>
                  )}
                </div>

                <div className="my-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-800">
                      {completed} <span className="text-slate-400 font-normal">/ {target} calls</span>
                    </span>
                    <span className="font-extrabold text-teal-700">{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-500' : pct >= 50 ? 'bg-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Target Modifier */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {editingId === emp.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold"
                    />
                    <button
                      onClick={() => handleSaveTarget(emp.id)}
                      className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-500">Daily Target: {emp.daily_call_target}</span>
                    <button
                      onClick={() => {
                        setEditingId(emp.id);
                        setTargetInput(emp.daily_call_target.toString());
                      }}
                      className="text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Change Target
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

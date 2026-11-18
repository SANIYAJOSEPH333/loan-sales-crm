import React, { useState, useEffect } from 'react';
import { callService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { PhoneCall, Calendar, Clock, RefreshCw, Filter } from 'lucide-react';

export const StaffCallLogs = () => {
  const [calls, setCalls] = useState([]);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const res = await callService.getCalls({ outcome: outcomeFilter || null });
      setCalls(res.data);
    } catch (err) {
      console.error('Failed to load call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [outcomeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Call History & Log Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete audit trail of all telephone conversations, customer responses, and callback schedules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Call Outcomes</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            <option value="FOLLOW_UP_REQUIRED">FOLLOW_UP_REQUIRED</option>
            <option value="CALL_BACK_LATER">CALL_BACK_LATER</option>
            <option value="NO_ANSWER">NO_ANSWER</option>
            <option value="BUSY">BUSY</option>
          </select>
          <button onClick={fetchCalls} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4">Call Remarks</th>
                <th className="py-3.5 px-4">Next Callback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Loading call records...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    No calls recorded yet.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <p className="font-bold">{call.call_date}</p>
                      <p className="text-[10px] text-slate-400">{call.call_time}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{call.customer_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{call.customer_phone}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={call.outcome} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">{call.remarks || '-'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {call.next_follow_up_date ? `${call.next_follow_up_date} ${call.next_follow_up_time || ''}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

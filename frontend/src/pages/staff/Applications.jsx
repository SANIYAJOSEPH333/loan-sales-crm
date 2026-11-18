import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { FileText, Eye, MessageSquare, RefreshCw, History } from 'lucide-react';

export const StaffApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [appDetails, setAppDetails] = useState(null);

  // Remarks state
  const [isRemarksOpen, setIsRemarksOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationService.getApplications();
      setApplications(res.data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openDetails = async (app) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
    try {
      const res = await applicationService.getApplication(app.id);
      setAppDetails(res.data);
    } catch (err) {
      console.error('Failed to load application details:', err);
    }
  };

  const handleAddRemark = async (e) => {
    e.preventDefault();
    if (!remarkText) return;

    try {
      await applicationService.updateApplication(selectedApp.id, {
        remarks: `${selectedApp.remarks || ''} | Staff update: ${remarkText}`,
      });
      setIsRemarksOpen(false);
      setRemarkText('');
      fetchApplications();
    } catch (err) {
      alert('Failed to update remark');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Loan Applications</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow up with bank desk representatives and track sanction progress for your assigned customers.
          </p>
        </div>
        <button onClick={fetchApplications} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Application No.</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Lender Bank</th>
                <th className="py-3.5 px-4">Loan Scheme</th>
                <th className="py-3.5 px-4">Requested (₹)</th>
                <th className="py-3.5 px-4">Approved (₹)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">Loading applications...</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">No loan applications filed yet.</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{app.application_number}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{app.customer_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{app.bank_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{app.scheme_name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{Number(app.requested_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                      {app.approved_amount ? `₹${Number(app.approved_amount).toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setIsRemarksOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Note
                        </button>
                        <button
                          onClick={() => openDetails(app)}
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Follow-up Note Modal */}
      <Modal
        isOpen={isRemarksOpen}
        onClose={() => setIsRemarksOpen(false)}
        title={selectedApp ? `Add Note: ${selectedApp.application_number}` : 'Add Follow-up Note'}
        subtitle="Log bank officer conversation or document requirement"
      >
        <form onSubmit={handleAddRemark} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Remark / Communication Update *</label>
            <textarea
              rows="3"
              required
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="Spoke with Bank Manager Mr. Mehta. Credit team reviewing salary slip..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRemarksOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
            >
              Save Remark
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedApp ? `Application ${selectedApp.application_number}` : 'Details'}
        subtitle="Full history and remarks"
      >
        {appDetails ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p><span className="text-slate-400">Customer:</span> <span className="font-bold text-slate-800">{appDetails.application.customer_name}</span></p>
              <p><span className="text-slate-400">Status:</span> <Badge status={appDetails.application.status} /></p>
              <p className="mt-1"><span className="text-slate-400">Latest Remarks:</span> {appDetails.application.remarks || 'None'}</p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-teal-600" /> Status History
              </h4>
              <div className="space-y-2 border-l-2 border-teal-500 pl-3">
                {appDetails.history.map((h) => (
                  <div key={h.id}>
                    <p className="font-bold text-slate-800">{h.status_to}</p>
                    <p className="text-[11px] text-slate-600">{h.remarks}</p>
                    <p className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400">Loading...</div>
        )}
      </Modal>
    </div>
  );
};

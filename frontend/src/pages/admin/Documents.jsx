import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  FileCheck, Download, Check, X, AlertCircle, RefreshCw,
  FileText, CheckCircle2, Clock
} from 'lucide-react';

export const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Rejection modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentService.getDocuments({
        verification_status: statusFilter,
        document_type: typeFilter,
      });
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, typeFilter]);

  const handleVerify = async (id) => {
    try {
      await documentService.verifyDocument(id, 'VERIFIED');
      fetchDocuments();
    } catch (err) {
      alert('Failed to verify document');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionRemarks) {
      alert('Rejection remarks are mandatory');
      return;
    }
    try {
      await documentService.verifyDocument(selectedDoc.id, 'REJECTED', rejectionRemarks);
      setIsRejectOpen(false);
      setRejectionRemarks('');
      fetchDocuments();
    } catch (err) {
      alert('Failed to reject document');
    }
  };

  const handleDownload = (id) => {
    window.open(`/api/documents/${id}/download`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">KYC Document Verification Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin verification queue for Aadhaar, PAN, salary slips, and bank statements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Verification Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700"
          >
            <option value="">All Document Types</option>
            <option value="AADHAAR_CARD">Aadhaar Card</option>
            <option value="PAN_CARD">PAN Card</option>
            <option value="SALARY_SLIPS">Salary Slips</option>
            <option value="BANK_STATEMENTS">Bank Statements</option>
            <option value="EMPLOYMENT_PROOF">Employment Proof</option>
            <option value="ADDRESS_PROOF">Address Proof</option>
          </select>

          <button
            onClick={fetchDocuments}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">File Name & Size</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400">
                    No documents found in this view.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{doc.customer_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {doc.document_type?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      <p>{doc.file_name}</p>
                      <span className="text-[10px] text-slate-400">
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.uploaded_by_name}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={doc.verification_status} />
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 font-medium max-w-xs truncate">
                      {doc.rejection_remarks || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleDownload(doc.id)}
                          className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded-lg"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {doc.verification_status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleVerify(doc.id)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Verify
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDoc(doc);
                                setRejectionRemarks('');
                                setIsRejectOpen(true);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title={selectedDoc ? `Reject ${selectedDoc.document_type?.replace(/_/g, ' ')}` : 'Reject Document'}
        subtitle="Staff will be notified with your rejection remarks to request re-upload"
      >
        <form onSubmit={handleReject} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700">Rejection Remarks *</label>
            <textarea
              rows="3"
              required
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              placeholder="e.g. Document is blurred; please upload clear PDF scan showing all 4 corners..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { documentService, leadService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  UploadCloud, FileCheck, CheckCircle2, AlertCircle,
  Download, Plus, RefreshCw, FileText
} from 'lucide-react';

export const StaffDocumentCollection = () => {
  const [documents, setDocuments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [leadId, setLeadId] = useState('');
  const [documentType, setDocumentType] = useState('AADHAAR_CARD');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, lRes] = await Promise.all([
        documentService.getDocuments(),
        leadService.getLeads(),
      ]);
      setDocuments(dRes.data);
      setLeads(lRes.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !leadId) {
      setError('Please select a customer and choose a file');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('lead_id', leadId);
    formData.append('document_type', documentType);
    formData.append('file', file);

    try {
      await documentService.uploadDocument(formData);
      setMessage('Document uploaded successfully and queued for Admin verification!');
      setIsUploadOpen(false);
      setFile(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Document Collection Desk</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Collect KYC files, salary slips, and bank statements for your assigned borrowers.
          </p>
        </div>
        <button
          onClick={() => {
            setLeadId(leads[0]?.id || '');
            setDocumentType('AADHAAR_CARD');
            setFile(null);
            setError('');
            setIsUploadOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
        >
          <UploadCloud className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {message}
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Admin Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">Loading documents...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">No documents collected yet.</td>
                </tr>
              ) : (
                documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{d.customer_name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{d.document_type?.replace(/_/g, ' ')}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{d.file_name}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{new Date(d.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={d.verification_status} />
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 font-medium max-w-xs truncate">
                      {d.rejection_remarks || (d.verification_status === 'VERIFIED' ? 'Approved by Admin' : '-')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <a
                          href={`/api/documents/${d.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg inline-flex"
                          title="Download / View"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {d.verification_status === 'REJECTED' && (
                          <button
                            onClick={() => {
                              setLeadId(d.lead_id);
                              setDocumentType(d.document_type);
                              setIsUploadOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold"
                          >
                            Re-upload
                          </button>
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

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Customer KYC Document"
        subtitle="File will be submitted to Admin for verification"
      >
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">{error}</div>}

          <div>
            <label className="block font-semibold text-slate-700">Customer Lead *</label>
            <select
              required
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">Select Customer</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.full_name} ({l.customer_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-semibold"
            >
              <option value="AADHAAR_CARD">Aadhaar Card</option>
              <option value="PAN_CARD">PAN Card</option>
              <option value="SALARY_SLIPS">Salary Slips</option>
              <option value="BANK_STATEMENTS">Bank Statements (6 Months)</option>
              <option value="EMPLOYMENT_PROOF">Employment Proof / ITR</option>
              <option value="ADDRESS_PROOF">Address Proof</option>
              <option value="OTHER">Other Supporting Document</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700">Select File (PDF, JPG, PNG) *</label>
            <input
              type="file"
              required
              accept=".pdf, .jpg, .jpeg, .png"
              onChange={(e) => setFile(e.target.files[0])}
              className="mt-1 w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Submit Document'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

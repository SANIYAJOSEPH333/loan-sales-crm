import React, { useState } from 'react';
import { bulkUploadService } from '../../services/crmServices';
import { Badge } from '../../components/common/Badge';
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle,
  Download, ArrowRight, RefreshCw, Check
} from 'lucide-react';

export const AdminBulkUpload = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(null);
      setSuccessMessage('');
      setError('');
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await bulkUploadService.previewFile(formData);
      setPreview(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to preview file.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || preview.valid_count === 0) return;
    setImporting(true);
    setError('');

    try {
      const leadsToImport = preview.valid_preview.map((r) => ({
        full_name: r.full_name,
        phone_number: r.phone_number,
        email: r.email,
        city: r.city,
        address: r.address,
        employment_type: r.employment_type,
        monthly_income: r.monthly_income,
        required_loan_amount: r.required_loan_amount,
        loan_type: r.loan_type,
      }));

      const res = await bulkUploadService.importLeads(leadsToImport);
      setSuccessMessage(`Successfully imported ${res.data.imported_count} valid leads into PostgreSQL!`);
      setPreview(null);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to import leads.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleTemplate = () => {
    const headers = 'full_name,phone_number,email,city,employment_type,monthly_income,required_loan_amount,loan_type\n';
    const sampleRows =
      'Rajesh Khanna,+91 9988776655,rajesh@example.com,Mumbai,SALARIED,95000,2500000,HOME_LOAN\n' +
      'Anjali Sharma,+91 9988776656,anjali@example.com,Delhi,BUSINESS,180000,5000000,BUSINESS_LOAN\n' +
      'Sunil Verma,+91 9988776657,sunil@example.com,Bengaluru,SALARIED,70000,800000,PERSONAL_LOAN\n';

    const blob = new Blob([headers + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Lead Upload</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Import customer leads from CSV or Excel spreadsheets with instant validation and duplicate checks.
          </p>
        </div>
        <button
          onClick={downloadSampleTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" /> Download Sample CSV
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {successMessage}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600" /> {error}
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:border-teal-500 transition-colors">
        <UploadCloud className="w-12 h-12 text-teal-600 mx-auto mb-2 stroke-1" />
        <h3 className="text-sm font-bold text-slate-900">Upload CSV or Excel File (.csv, .xlsx)</h3>
        <p className="text-xs text-slate-500 mt-1">
          Mandatory columns: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">full_name</code>,{' '}
          <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">phone_number</code>
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <input
            type="file"
            id="fileInput"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="fileInput"
            className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            {file ? file.name : 'Select File from Computer'}
          </label>

          {file && (
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Validating...
                </>
              ) : (
                <>
                  Preview & Validate <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Summary Banner */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-4 text-xs">
              <span className="font-bold text-slate-700">File: {preview.filename}</span>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                Total Rows: {preview.total_rows}
              </span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                Valid: {preview.valid_count}
              </span>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold">
                Invalid / Duplicates: {preview.invalid_count}
              </span>
            </div>

            {preview.valid_count > 0 && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing to PostgreSQL...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Import {preview.valid_count} Valid Records
                  </>
                )}
              </button>
            )}
          </div>

          {/* Invalid Rows Alert (if any) */}
          {preview.invalid_count > 0 && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 text-xs">
              <p className="font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Invalid Rows Detected ({preview.invalid_count})
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {preview.invalid_preview.map((inv) => (
                  <div key={inv.row_index} className="text-[11px] text-rose-700">
                    Row {inv.row_index}: <span className="font-semibold">{inv.full_name || 'Empty'}</span> ({inv.phone_number}) — {inv.errors.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          <div className="p-4">
            <h4 className="font-bold text-slate-900 text-xs mb-3">
              Valid Records Ready for Import (Previewing {preview.valid_preview.length} rows)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">City</th>
                    <th className="py-2.5 px-3">Income</th>
                    <th className="py-2.5 px-3">Loan Amount</th>
                    <th className="py-2.5 px-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.valid_preview.map((row) => (
                    <tr key={row.row_index} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-400">{row.row_index}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.full_name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{row.phone_number}</td>
                      <td className="py-2.5 px-3 text-slate-500">{row.email || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.city || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-800">₹{Number(row.monthly_income).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹{Number(row.required_loan_amount).toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-teal-600 font-medium">{row.loan_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

export const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getStaffDashboard: () => api.get('/dashboard/staff'),
};

export const leadService = {
  getLeads: (params) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (data) => api.post('/leads', data),
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  getLeadHistory: (id) => api.get(`/leads/${id}/history`),
};

export const employeeService = {
  getEmployees: (status) => api.get('/employees', { params: { status } }),
  getEmployee: (id) => api.get(`/employees/${id}`),
  createEmployee: (data) => api.post('/employees', data),
  updateEmployee: (id, data) => api.put(`/employees/${id}`, data),
  updateTarget: (id, daily_call_target) => api.patch(`/employees/${id}/target`, { daily_call_target }),
  toggleStatus: (id) => api.patch(`/employees/${id}/toggle-status`),
  resetPassword: (id, new_password) => api.post(`/employees/${id}/reset-password`, { new_password }),
  deleteEmployee: (id) => api.delete(`/employees/${id}`),
};

export const distributionService = {
  getAllocations: () => api.get('/distribution/allocations'),
  assignLeads: (lead_ids, employee_id, notes) => api.post('/distribution/assign', { lead_ids, employee_id, notes }),
  balancedDistribute: (lead_ids, employee_ids, notes) => api.post('/distribution/balanced-distribute', { lead_ids, employee_ids, notes }),
  getRecentHistory: () => api.get('/distribution/recent-history'),
};

export const bulkUploadService = {
  previewFile: (formData) => api.post('/bulk-upload/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  importLeads: (leads, lead_source = 'BULK_UPLOAD') => api.post('/bulk-upload/import', { leads, lead_source }),
};

export const callService = {
  getCalls: (params) => api.get('/calls', { params }),
  logCall: (data) => api.post('/calls', data),
};

export const followUpService = {
  getFollowUps: (params) => api.get('/followups', { params }),
  scheduleFollowUp: (data) => api.post('/followups', data),
  markCompleted: (id) => api.patch(`/followups/${id}/complete`),
  reschedule: (id, data) => api.patch(`/followups/${id}/reschedule`, data),
};

export const documentService = {
  getDocuments: (params) => api.get('/documents', { params }),
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verifyDocument: (id, verification_status, rejection_remarks = null) =>
    api.patch(`/documents/${id}/verify`, { verification_status, rejection_remarks }),
  downloadDocumentUrl: (id) => `/api/documents/${id}/download`,
};

export const bankService = {
  getBanks: (status) => api.get('/banks', { params: { status } }),
  getBank: (id) => api.get(`/banks/${id}`),
  createBank: (data) => api.post('/banks', data),
  updateBank: (id, data) => api.put(`/banks/${id}`, data),
  deleteBank: (id) => api.delete(`/banks/${id}`),
};

export const schemeService = {
  getSchemes: (params) => api.get('/schemes', { params }),
  getScheme: (id) => api.get(`/schemes/${id}`),
  createScheme: (data) => api.post('/schemes', data),
  updateScheme: (id, data) => api.put(`/schemes/${id}`, data),
  deleteScheme: (id) => api.delete(`/schemes/${id}`),
};

export const applicationService = {
  getApplications: (params) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (data) => api.post('/applications', data),
  updateApplication: (id, data) => api.put(`/applications/${id}`, data),
  approve: (id, data) => api.post(`/approvals/${id}/approve`, data),
  reject: (id, data) => api.post(`/approvals/${id}/reject`, data),
  disburse: (id, data) => api.post(`/approvals/${id}/disburse`, data),
  close: (id, data) => api.post(`/approvals/${id}/close`, data),
};

export const reportService = {
  getSummary: (startDate, endDate, employeeId) =>
    api.get('/reports/summary', { params: { start_date: startDate, end_date: endDate, employee_id: employeeId } }),
  getExportUrl: (reportType, startDate, endDate) =>
    `/api/reports/export/${reportType}?start_date=${startDate || ''}&end_date=${endDate || ''}`,
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
};

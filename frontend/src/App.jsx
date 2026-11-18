import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { AdminLayout } from './layouts/AdminLayout';
import { StaffLayout } from './layouts/StaffLayout';
import { MobileAdminLayout } from './layouts/MobileAdminLayout';

// Auth
import { Login } from './pages/auth/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminLeads } from './pages/admin/Leads';
import { AdminBulkUpload } from './pages/admin/BulkUpload';
import { AdminDistribution } from './pages/admin/Distribution';
import { AdminEmployees } from './pages/admin/Employees';
import { AdminTargets } from './pages/admin/Targets';
import { AdminFollowUps } from './pages/admin/FollowUps';
import { AdminDocuments } from './pages/admin/Documents';
import { AdminBanks } from './pages/admin/Banks';
import { AdminSchemes } from './pages/admin/Schemes';
import { AdminApplications } from './pages/admin/Applications';
import { AdminApprovals } from './pages/admin/Approvals';
import { AdminReports } from './pages/admin/Reports';

// Staff Pages
import { StaffDashboard } from './pages/staff/Dashboard';
import { StaffAssignedLeads } from './pages/staff/AssignedLeads';
import { StaffCallLogs } from './pages/staff/CallLogs';
import { StaffFollowUps } from './pages/staff/FollowUps';
import { StaffDocumentCollection } from './pages/staff/DocumentCollection';
import { StaffApplications } from './pages/staff/Applications';
import { StaffPerformance } from './pages/staff/Performance';

// Mobile Admin Pages
import { MobileDashboard } from './pages/mobile/MobileDashboard';
import { MobileLeads } from './pages/mobile/MobileLeads';

// Route Guards
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/staff/dashboard" replace />;
  return children;
};

const StaffRoute = ({ children }) => {
  const { isAuthenticated, isStaff, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isStaff && !isAdmin) return <Navigate to="/login" replace />;
  return children;
};

const RootRedirect = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/staff/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />

            {/* Desktop Admin Portal Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="bulk-upload" element={<AdminBulkUpload />} />
              <Route path="distribution" element={<AdminDistribution />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="targets" element={<AdminTargets />} />
              <Route path="followups" element={<AdminFollowUps />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="banks" element={<AdminBanks />} />
              <Route path="schemes" element={<AdminSchemes />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            {/* Mobile Admin Portal UI (/admin/mobile) */}
            <Route
              path="/admin/mobile"
              element={
                <AdminRoute>
                  <MobileAdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<MobileDashboard />} />
              <Route path="leads" element={<MobileLeads />} />
              <Route path="bulk-upload" element={<AdminBulkUpload />} />
              <Route path="distribution" element={<AdminDistribution />} />
              <Route path="employees" element={<AdminEmployees />} />
              <Route path="targets" element={<AdminTargets />} />
              <Route path="followups" element={<AdminFollowUps />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="banks" element={<AdminBanks />} />
              <Route path="schemes" element={<AdminSchemes />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="approvals" element={<AdminApprovals />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>

            {/* Staff / Call Centre Portal Routes */}
            <Route
              path="/staff"
              element={
                <StaffRoute>
                  <StaffLayout />
                </StaffRoute>
              }
            >
              <Route index element={<Navigate to="/staff/dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="leads" element={<StaffAssignedLeads />} />
              <Route path="calls" element={<StaffCallLogs />} />
              <Route path="followups" element={<StaffFollowUps />} />
              <Route path="documents" element={<StaffDocumentCollection />} />
              <Route path="applications" element={<StaffApplications />} />
              <Route path="performance" element={<StaffPerformance />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

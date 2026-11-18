import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDrawer } from '../components/common/NotificationDrawer';
import {
  LayoutDashboard, Users, UserPlus, SendHorizontal, PhoneCall,
  CalendarCheck, FileCheck, Building2, Layers, FileText, CheckCircle2,
  BarChart3, Smartphone, LogOut, Bell, Shield, Search, ChevronDown, Menu, X
} from 'lucide-react';

const ADMIN_NAV = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/leads', label: 'Lead Management', icon: Users },
  { path: '/admin/bulk-upload', label: 'Bulk Lead Upload', icon: UserPlus },
  { path: '/admin/distribution', label: 'Lead Distribution', icon: SendHorizontal },
  { path: '/admin/employees', label: 'Employee Management', icon: Shield },
  { path: '/admin/targets', label: 'Daily Call Targets', icon: PhoneCall },
  { path: '/admin/followups', label: 'Follow-up Management', icon: CalendarCheck },
  { path: '/admin/documents', label: 'Document Verification', icon: FileCheck },
  { path: '/admin/banks', label: 'Bank Management', icon: Building2 },
  { path: '/admin/schemes', label: 'Loan Schemes', icon: Layers },
  { path: '/admin/applications', label: 'Loan Applications', icon: FileText },
  { path: '/admin/approvals', label: 'Loan Approval & Closure', icon: CheckCircle2 },
  { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-navy-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 bg-navy-950/70 border-b border-navy-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white text-lg shadow-sm">
              ₹
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white uppercase">CloudHouse</h1>
              <p className="text-[10px] text-teal-400 font-medium tracking-wider uppercase">Loan CRM Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Modules
          </p>
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Mobile View Switcher Banner */}
        <div className="p-3 bg-navy-950/60 border-t border-navy-800">
          <button
            onClick={() => navigate('/admin/mobile')}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-navy-800 hover:bg-teal-700 text-teal-300 hover:text-white rounded-lg text-xs font-medium transition-colors border border-navy-700/60"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open Mobile Admin UI</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Admin Portal</span>
              <span>/</span>
              <span className="text-teal-600 capitalize">
                {location.pathname.replace('/admin/', '').replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Right Header items */}
          <div className="flex items-center space-x-3">
            {/* Quick Mobile Mode Toggle */}
            <button
              onClick={() => navigate('/admin/mobile')}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
              title="Test Mobile Admin UI layout"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile UI</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
                  {user?.full_name ? user.full_name.charAt(0) : 'A'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">{user?.full_name || 'Admin'}</p>
                  <p className="text-slate-500 text-[10px]">Administrator</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-teal-50 text-teal-700 rounded-md font-semibold">
                      Role: ADMIN
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/admin/mobile')}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-teal-600" /> Switch to Mobile Admin
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Notification slideover */}
      <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
};

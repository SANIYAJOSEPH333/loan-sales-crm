import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationDrawer } from '../components/common/NotificationDrawer';
import {
  LayoutDashboard, Users, UserPlus, SendHorizontal, PhoneCall,
  CalendarCheck, FileCheck, Building2, Layers, FileText, CheckCircle2,
  BarChart3, Shield, Monitor, Bell, LogOut, X, ChevronRight, Menu
} from 'lucide-react';

const MOBILE_ALL_MODULES = [
  { path: '/admin/mobile', label: '1. Dashboard', icon: LayoutDashboard, desc: 'Overall KPIs & stats' },
  { path: '/admin/mobile/leads', label: '2. Lead Management', icon: Users, desc: 'View, search, edit leads' },
  { path: '/admin/mobile/bulk-upload', label: '3. Bulk Lead Upload', icon: UserPlus, desc: 'Upload CSV & Excel leads' },
  { path: '/admin/mobile/distribution', label: '4. Lead Distribution', icon: SendHorizontal, desc: 'Assign & balance leads' },
  { path: '/admin/mobile/employees', label: '5. Employee Management', icon: Shield, desc: 'Staff directory & passwords' },
  { path: '/admin/mobile/targets', label: '6. Daily Call Targets', icon: PhoneCall, desc: 'Daily target tracking' },
  { path: '/admin/mobile/followups', label: '7. Customer Follow-ups', icon: CalendarCheck, desc: 'Today & upcoming calls' },
  { path: '/admin/mobile/documents', label: '8. Document Verification', icon: FileCheck, desc: 'Verify/reject KYC documents' },
  { path: '/admin/mobile/banks', label: '9. Bank Management', icon: Building2, desc: 'Partner bank catalog' },
  { path: '/admin/mobile/schemes', label: '10. Loan Schemes', icon: Layers, desc: 'Interest rates & tenure' },
  { path: '/admin/mobile/applications', label: '11. Loan Applications', icon: FileText, desc: 'Pipeline & status tracking' },
  { path: '/admin/mobile/approvals', label: '12. Approvals & Closure', icon: CheckCircle2, desc: 'Approve, disburse, close' },
  { path: '/admin/mobile/reports', label: '13. Reports & Analytics', icon: BarChart3, desc: 'Analytics & CSV exports' },
];

export const MobileAdminLayout = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine active title
  const activeModule = MOBILE_ALL_MODULES.find((m) => m.path === location.pathname);
  const currentTitle = activeModule ? activeModule.label.replace(/^\d+\.\s*/, '') : 'Admin Portal';

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center sm:py-4">
      {/* Mobile App Device Container */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[844px] sm:max-h-[900px] flex flex-col shadow-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 relative">
        {/* Top Mobile Status & Navigation Bar */}
        <header className="bg-navy-900 text-white px-4 py-3.5 sticky top-0 z-30 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white text-xs">
              ₹
            </div>
            <div>
              <h1 className="text-xs font-bold leading-tight uppercase tracking-wider text-white">CloudHouse</h1>
              <p className="text-[10px] text-teal-400 font-semibold tracking-tight">{currentTitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Desktop Switcher */}
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-2 py-1 bg-navy-800 hover:bg-navy-700 text-slate-300 rounded text-[11px] font-medium flex items-center gap-1 border border-navy-700"
              title="Switch to Desktop Admin Portal"
            >
              <Monitor className="w-3 h-3" />
              <span>Desktop</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="p-1.5 text-slate-300 hover:text-white relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-teal-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Mobile Content Area */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 bg-slate-50">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Touch-friendly) */}
        <nav className="fixed bottom-0 sm:absolute left-0 right-0 h-16 bg-white border-t border-slate-200 z-30 flex items-center justify-around px-2 shadow-lg">
          <NavLink
            to="/admin/mobile"
            end
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/admin/mobile/leads"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>Leads</span>
          </NavLink>

          <NavLink
            to="/admin/mobile/distribution"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <SendHorizontal className="w-5 h-5 mb-0.5" />
            <span>Assign</span>
          </NavLink>

          <NavLink
            to="/admin/mobile/approvals"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 py-1 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <CheckCircle2 className="w-5 h-5 mb-0.5" />
            <span>Approvals</span>
          </NavLink>

          <button
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center w-14 py-1 text-[10px] font-semibold transition-colors ${
              moreDrawerOpen ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span>All 14</span>
          </button>
        </nav>

        {/* All Modules Drawer (Provides 1-touch navigation to all 14 Admin Modules!) */}
        {moreDrawerOpen && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col">
            <div className="p-4 bg-navy-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">All Admin Modules (14)</h3>
                <p className="text-[11px] text-teal-400">Complete access in mobile format</p>
              </div>
              <button
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 pb-16">
              {MOBILE_ALL_MODULES.map((mod) => {
                const Icon = mod.icon;
                const active = location.pathname === mod.path;
                return (
                  <div
                    key={mod.path}
                    onClick={() => {
                      setMoreDrawerOpen(false);
                      navigate(mod.path);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      active
                        ? 'bg-teal-50 border-teal-300 text-teal-900'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{mod.label}</p>
                        <p className="text-[11px] text-slate-500">{mod.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                );
              })}

              {/* Profile & Logout Action */}
              <div className="pt-4 border-t border-slate-200">
                <div className="p-3 bg-slate-100 rounded-xl mb-3">
                  <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] bg-navy-900 text-white px-2 py-0.5 rounded font-semibold">
                    ADMIN
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e, directRedirect = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userInfo = await login(email, password);
      if (directRedirect) {
        navigate(directRedirect);
      } else if (userInfo.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Invalid email or password. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-navy-900 to-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <span className="text-3xl font-extrabold text-white">₹</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          CloudHouse CRM
        </h2>
        <p className="mt-1 text-xs text-teal-300 font-medium tracking-wider uppercase">
          Loan Sales & Call Centre CRM System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@crm.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-600" /> Quick Assessment Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin@crm.com', 'Admin@123')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <p className="font-bold text-slate-800">Admin Demo</p>
                <p className="text-[10px] text-slate-500">admin@crm.com</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('staff1@crm.com', 'Staff@123')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <p className="font-bold text-slate-800">Staff 1 (Priya)</p>
                <p className="text-[10px] text-slate-500">staff1@crm.com</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('staff2@crm.com', 'Staff@123')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <p className="font-bold text-slate-800">Staff 2 (Vikram)</p>
                <p className="text-[10px] text-slate-500">staff2@crm.com</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('staff3@crm.com', 'Staff@123')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <p className="font-bold text-slate-800">Staff 3 (Ananya)</p>
                <p className="text-[10px] text-slate-500">staff3@crm.com</p>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Password for all staff: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Staff@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

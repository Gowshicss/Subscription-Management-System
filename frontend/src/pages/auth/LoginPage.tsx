import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post('/auth/login', { email, password });
      login(res.token, res.user);

      if (res.user.role === 'CUSTOMER') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top minimal header */}
      <div className="w-full max-w-4xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-plum flex items-center justify-center font-bold text-white text-sm shadow-xs">
            B
          </div>
          <span className="font-bold text-sm tracking-tight text-charcoal">
            Brightloop Software
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted">
          Odoo x Make-A-Ton 9.0
        </span>
      </div>

      {/* Main Split Authentication Card (Exact Reference Style from Image 4) */}
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-border shadow-lg overflow-hidden grid grid-cols-1 md:grid-cols-12 transition-all">
        {/* Left Plum Brand Panel */}
        <div className="md:col-span-5 bg-plum text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-teal-accent/10 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center font-bold text-white text-sm">
                B
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-teal-soft block leading-none">
                  SaaS Suite
                </span>
                <span className="text-sm font-bold text-white tracking-tight">
                  Brightloop
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-teal-soft mb-6">
              <Sparkles className="w-3 h-3 text-teal-soft" />
              <span>Subscription Control Center</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Manage subscriptions, recurring billing, and invoices in one place.
            </h1>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 text-[11px] text-[#D8C9D5]">
            <p>Built for Brightloop Software internal operations and customer self-service.</p>
          </div>
        </div>

        {/* Right Clean White Form Panel */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted">
                Access Portal
              </span>
              <div className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted">
                <ShieldCheck className="w-4 h-4 text-plum" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight mb-6">
              Sign in
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200/80 text-red-700 text-xs rounded-xl font-medium">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal mb-1.5">
                  Work Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@brightloop.io"
                    className="brutalist-input pl-10"
                  />
                  <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-plum font-semibold hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="brutalist-input pl-10 font-mono"
                  />
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-plum hover:bg-plum-light active:bg-plum-dark text-white font-semibold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-xs mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Credentials for Evaluators */}
            <div className="mt-6 pt-5 border-t border-border">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">
                Hackathon Quick-Login:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@brightloop.io', 'Brightloop@2026!')}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-[#FAF9F7] border border-border rounded-lg hover:border-plum hover:text-plum transition-all text-center"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('staff@brightloop.io', 'Staff@2026!')}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-[#FAF9F7] border border-border rounded-lg hover:border-plum hover:text-plum transition-all text-center"
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('acme@customer.com', 'Customer@2026!')}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-[#FAF9F7] border border-border rounded-lg hover:border-plum hover:text-plum transition-all text-center"
                >
                  Customer
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-subtle text-center">
            <span className="text-xs text-muted">New customer? </span>
            <Link to="/register" className="text-xs text-plum font-bold hover:underline">
              Create account
            </Link>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        Brightloop Platform • Built for Odoo Hackathon 2026
      </p>
    </div>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F8F8F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded bg-plum flex items-center justify-center font-bold text-white text-2xl shadow-brutal-sm">
            B
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-charcoal">
          BRIGHTLOOP SOFTWARE
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wider text-muted">
          Unified Subscription Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="brutalist-card bg-white py-8 px-6 sm:px-10 border border-border">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="brutalist-input pl-9"
                />
                <Mail className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-teal-accent hover:underline font-semibold">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="brutalist-input pl-9"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full brutalist-btn-primary justify-center py-2.5 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluators */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-plum uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-accent" />
              <span>Hackathon Evaluator Quick-Login</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@brightloop.io', 'Brightloop@2026!')}
                className="px-2 py-1.5 text-xs font-semibold bg-surface-secondary border border-border rounded hover:bg-plum hover:text-white transition-colors text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('staff@brightloop.io', 'Staff@2026!')}
                className="px-2 py-1.5 text-xs font-semibold bg-surface-secondary border border-border rounded hover:bg-plum hover:text-white transition-colors text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillDemo('acme@customer.com', 'Customer@2026!')}
                className="px-2 py-1.5 text-xs font-semibold bg-surface-secondary border border-border rounded hover:bg-plum hover:text-white transition-colors text-center"
              >
                Customer
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <span className="text-xs text-muted">New customer? </span>
            <Link to="/register" className="text-xs text-teal-accent font-bold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


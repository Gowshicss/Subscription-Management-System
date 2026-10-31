import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res: any = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      if (res.debugToken) {
        setDebugToken(res.debugToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-bold tracking-tight text-charcoal">
          Reset Your Password
        </h2>
        <p className="mt-1 text-center text-xs text-muted">
          Enter your registered email to receive a secure reset link.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="brutalist-card bg-white py-8 px-6 sm:px-10 border border-border">
          {submitted ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-charcoal">Reset Link Dispatched</h3>
              <p className="text-xs text-muted leading-relaxed">
                If an account exists for <strong className="text-charcoal">{email}</strong>, you will receive an email shortly with instructions.
              </p>

              {debugToken && (
                <div className="p-3 bg-surface-secondary border border-border rounded text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-plum block mb-1">
                    Development Quick Link:
                  </span>
                  <Link
                    to={`/reset-password?token=${debugToken}`}
                    className="text-xs text-teal-accent font-semibold hover:underline break-all"
                  >
                    Click to proceed with token: {debugToken.slice(0, 16)}...
                  </Link>
                </div>
              )}

              <div className="pt-4">
                <Link to="/login" className="brutalist-btn-secondary justify-center w-full">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Registered Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full brutalist-btn-primary justify-center py-2.5"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-muted hover:text-charcoal inline-flex items-center gap-1 font-semibold">
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

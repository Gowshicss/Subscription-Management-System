import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Lock, ArrowRight, Check, X } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const hasLength = newPassword.length > 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token. Please request a new link.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!isPasswordValid) {
      setError('Please satisfy all password criteria.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-plum flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
            B
          </div>
          <span className="text-sm font-bold tracking-tight text-charcoal">BRIGHTLOOP</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-charcoal">
          Create New Password
        </h2>
        <p className="mt-1 text-xs text-muted">
          Your new password must satisfy security standards.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-2xl border border-border shadow-xs py-8 px-6 sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <h3 className="text-base font-bold text-emerald-700">Password Updated!</h3>
              <p className="text-xs text-muted">
                Your password has been successfully reset. Redirecting to login in 3 seconds...
              </p>
              <Link to="/login" className="brutalist-btn-primary justify-center w-full">
                Go to Sign In Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="brutalist-input pl-9"
                  />
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="brutalist-input pl-9"
                  />
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="p-3.5 bg-[#FAF9F7] border border-border rounded-xl text-[11px] space-y-1.5">
                <div className="flex items-center gap-2">
                  {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasLength ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    More than 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasUpper ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    At least one uppercase character
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasLower ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    At least one lowercase character
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasSpecial ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    At least one special character
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full brutalist-btn-primary justify-center py-2.5 disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Set New Password'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};


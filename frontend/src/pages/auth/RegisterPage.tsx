import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Check, X, ArrowRight, Building, User, Mail, Phone, MapPin, Lock } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    billingAddress: '',
    city: '',
    state: '',
    country: 'USA',
    taxNumber: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Real-time password criteria
  const hasLength = formData.password.length > 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
  const isPasswordValid = hasLength && hasUpper && hasLower && hasSpecial;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Please satisfy all password complexity criteria.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res: any = await api.post('/auth/register', formData);
      login(res.token, res.user);
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-plum flex items-center justify-center text-white font-extrabold text-sm shadow-xs">
            B
          </div>
          <span className="text-sm font-bold tracking-tight text-charcoal">BRIGHTLOOP</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-charcoal">
          Create Brightloop Customer Account
        </h2>
        <p className="mt-1 text-xs text-muted">
          Access your software subscriptions, quotations and invoices
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white rounded-2xl border border-border shadow-xs py-8 px-6 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Company Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Acme Dynamics Ltd"
                    className="brutalist-input pl-9"
                  />
                  <Building className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Business Phone *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 012-3456"
                    className="brutalist-input pl-9"
                  />
                  <Phone className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  First Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Sarah"
                    className="brutalist-input pl-9"
                  />
                  <User className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Last Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Connor"
                    className="brutalist-input pl-9"
                  />
                  <User className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Business Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                  className="brutalist-input pl-9"
                />
                <Mail className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Billing Address *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleChange}
                  placeholder="100 Main St, Suite 400"
                  className="brutalist-input pl-9"
                />
                <MapPin className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="San Francisco"
                  className="brutalist-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="CA"
                  className="brutalist-input"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                  Tax / VAT ID
                </label>
                <input
                  type="text"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleChange}
                  placeholder="US-994821"
                  className="brutalist-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="brutalist-input pl-9"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3.5 bg-[#FAF9F7] border border-border rounded-xl text-[11px] space-y-1.5">
                <p className="font-bold text-plum uppercase text-[10px] tracking-wider mb-1">
                  Password Requirements:
                </p>
                <div className="flex items-center gap-2">
                  {hasLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasLength ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    More than 8 characters (currently: {formData.password.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasUpper ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    At least one uppercase character (A-Z)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasLower ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    At least one lowercase character (a-z)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {hasSpecial ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <X className="w-3.5 h-3.5 text-muted shrink-0" />}
                  <span className={hasSpecial ? 'text-emerald-700 font-medium' : 'text-muted'}>
                    At least one special character (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full brutalist-btn-primary justify-center py-2.5 mt-4 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center">
            <span className="text-xs text-muted">Already registered? </span>
            <Link to="/login" className="text-xs text-teal-accent font-bold hover:underline">
              Sign in to portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};


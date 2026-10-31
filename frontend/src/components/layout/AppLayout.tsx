import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  LayoutDashboard,
  Users,
  Package,
  Calendar,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Calculator,
  UserCheck,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [billingToast, setBillingToast] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTriggerBilling = async () => {
    setIsBillingRunning(true);
    setBillingToast(null);
    try {
      const res: any = await api.post('/billing/trigger');
      setBillingToast(
        `Billing run complete! Invoices Generated: ${res.invoicesGenerated}, Skipped: ${res.invoicesSkipped}, Total: $${Number(res.totalBilledAmount).toFixed(2)}`
      );
      setTimeout(() => setBillingToast(null), 8000);
    } catch (err: any) {
      setBillingToast(`Billing failed: ${err.message}`);
      setTimeout(() => setBillingToast(null), 8000);
    } finally {
      setIsBillingRunning(false);
    }
  };

  // Nav configurations based on role
  const adminNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Products & Variants', path: '/products', icon: Package },
    { label: 'Subscription Plans', path: '/plans', icon: Calendar },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payments', path: '/payments', icon: CreditCard },
    { label: 'Discounts', path: '/discounts', icon: Percent },
    { label: 'Taxes', path: '/taxes', icon: Calculator },
    { label: 'Staff Management', path: '/staff', icon: UserCheck },
    { label: 'Business Settings', path: '/settings', icon: Settings },
  ];

  const staffNav = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Quotations', path: '/quotations', icon: FileText },
    { label: 'Subscriptions', path: '/subscriptions', icon: Repeat },
    { label: 'Invoices', path: '/invoices', icon: Receipt },
    { label: 'Payments', path: '/payments', icon: CreditCard },
  ];

  const customerNav = [
    { label: 'Portal Overview', path: '/portal', icon: LayoutDashboard },
    { label: 'My Quotations', path: '/portal/quotations', icon: FileText },
    { label: 'My Subscriptions', path: '/portal/subscriptions', icon: Repeat },
    { label: 'My Invoices', path: '/portal/invoices', icon: Receipt },
    { label: 'Payment History', path: '/portal/payments', icon: CreditCard },
    { label: 'My Profile', path: '/portal/profile', icon: Users },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'STAFF' ? staffNav : customerNav;

  return (
    <div className="flex h-screen bg-[#F8F8F9] overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } flex flex-col bg-plum text-white border-r border-[#3D2339] transition-all duration-200 z-30 select-none`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#3D2339]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-teal-accent flex items-center justify-center font-bold text-white shrink-0 text-lg shadow-sm">
              B
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide text-white uppercase">Brightloop</span>
                <span className="text-[10px] text-teal-soft uppercase tracking-wider font-semibold">
                  {role} Portal
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded text-purple-light hover:text-white hover:bg-plum-light transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && item.path !== '/portal' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold tracking-wide transition-colors ${
                  isActive
                    ? 'bg-plum-light text-white border-l-2 border-teal-accent'
                    : 'text-[#D7C9D5] hover:bg-[#3E233B] hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0 text-teal-soft" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#3D2339] bg-[#3B2237]">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="truncate mr-2">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-teal-soft truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded hover:bg-[#4B2D47] text-[#D7C9D5] hover:text-white transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 rounded hover:bg-[#4B2D47] text-[#D7C9D5] hover:text-white transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              {role === 'CUSTOMER' ? 'Customer Portal' : 'Enterprise Workspace'}
            </span>
            <span className="text-muted">/</span>
            <span className="text-sm font-semibold text-charcoal">
              {navItems.find((n) => location.pathname.startsWith(n.path))?.label || 'Subscription System'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Manual Billing Trigger Button */}
            {role === 'ADMIN' && (
              <button
                onClick={handleTriggerBilling}
                disabled={isBillingRunning}
                className="brutalist-btn-primary bg-plum hover:bg-plum-light text-xs py-1.5 px-3"
                title="Manually execute recurring billing cycle"
              >
                <Zap className={`w-3.5 h-3.5 text-teal-accent ${isBillingRunning ? 'animate-spin' : ''}`} />
                {isBillingRunning ? 'Processing Billing...' : 'Run Billing Engine'}
              </button>
            )}

            {/* Role indicator badge */}
            <span className="brutalist-badge bg-surface-secondary text-plum border border-border">
              {role}
            </span>

            <div className="w-7 h-7 rounded bg-plum text-white font-bold text-xs flex items-center justify-center">
              {user?.firstName?.[0] || 'U'}
            </div>
          </div>
        </header>

        {/* Global Toast Alert if billing cycle triggered */}
        {billingToast && (
          <div className="bg-plum text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md border-b border-plum-light animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-accent" />
              <span>{billingToast}</span>
            </div>
            <button
              onClick={() => setBillingToast(null)}
              className="text-teal-soft hover:text-white text-sm ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Main View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

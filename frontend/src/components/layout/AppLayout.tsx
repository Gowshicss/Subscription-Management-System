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
  ShoppingBag,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isBillingRunning, setIsBillingRunning] = useState(false);
  const [billingToast, setBillingToast] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTriggerBilling = async () => {
    setIsBillingRunning(true);
    setBillingToast(null);
    try {
      const res: any = await api.post('/billing/trigger');
      setBillingToast(
        `Billing run complete! Invoices Generated: ${res.invoicesGenerated}, Skipped: ${res.invoicesSkipped}, Total: ₹${Number(res.totalBilledAmount).toFixed(2)}`
      );
      setTimeout(() => setBillingToast(null), 8000);
    } catch (err: any) {
      setBillingToast(`Billing failed: ${err.message}`);
      setTimeout(() => setBillingToast(null), 8000);
    } finally {
      setIsBillingRunning(false);
    }
  };

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
    { label: 'Explore & Subscribe', path: '/portal/explore', icon: ShoppingBag },
    { label: 'My Quotations', path: '/portal/quotations', icon: FileText },
    { label: 'My Subscriptions', path: '/portal/subscriptions', icon: Repeat },
    { label: 'My Invoices', path: '/portal/invoices', icon: Receipt },
    { label: 'Payment History', path: '/portal/payments', icon: CreditCard },
    { label: 'My Profile', path: '/portal/profile', icon: Users },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'STAFF' ? staffNav : customerNav;
  const currentNav = navItems.find((n) => location.pathname === n.path || (n.path !== '/dashboard' && n.path !== '/portal' && location.pathname.startsWith(n.path)));

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-charcoal overflow-hidden font-sans">
      {/* Clean White Sidebar (Reference Style) */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } flex flex-col bg-white border-r border-border transition-all duration-200 z-30 select-none shadow-xs`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-plum flex items-center justify-center font-bold text-white shrink-0 text-base shadow-xs">
              B
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight text-charcoal">
                  Brightloop
                </span>
                <span className="text-[10px] text-muted font-medium truncate">
                  {role === 'CUSTOMER' ? 'Customer Self-Service' : 'Enterprise Subscription'}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-muted hover:text-charcoal hover:bg-[#F4F3F1] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items (Reference Pill Buttons) */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && item.path !== '/portal' && location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-plum text-white shadow-xs'
                    : 'text-[#525055] hover:bg-[#F4F3F1] hover:text-charcoal'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-[#737078]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer (Clean User Card) */}
        <div className="p-3 border-t border-border bg-white">
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-[#FAF9F7] border border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                <div className="w-8 h-8 rounded-full bg-[#EFE7EC] text-plum font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.firstName?.[0] || 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-charcoal truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-muted truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-white transition-colors shrink-0"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex justify-center p-2 rounded-xl hover:bg-[#F4F3F1] text-muted hover:text-red-600 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAF9F6]">
        {/* Top Header (Clean Reference Bar) */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 z-20 shadow-xs">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <span className="text-muted/80">Home</span>
            <span>/</span>
            <span className="font-semibold text-charcoal">
              {currentNav?.label || 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Pill Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live: INR (₹)</span>
            </div>

            {/* Admin Manual Billing Trigger Button */}
            {role === 'ADMIN' && (
              <button
                onClick={handleTriggerBilling}
                disabled={isBillingRunning}
                className="bg-plum hover:bg-plum-light text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-[0.98]"
                title="Execute recurring billing cycle"
              >
                <Zap className={`w-3.5 h-3.5 text-teal-soft ${isBillingRunning ? 'animate-spin' : ''}`} />
                {isBillingRunning ? 'Processing...' : 'Run Billing Engine'}
              </button>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-charcoal block leading-tight">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                  {role}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-plum text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.firstName?.[0] || 'U'}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-full border border-border text-muted hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Floating Toast Notification (Reference Style in Bottom Right) */}
        {billingToast && (
          <div className="fixed bottom-6 right-6 bg-white border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3 z-50 animate-bounce-short max-w-md">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 text-xs">
              <span className="font-bold text-charcoal block">Billing Cycle Executed</span>
              <span className="text-muted block text-[11px] mt-0.5">{billingToast}</span>
            </div>
            <button
              onClick={() => setBillingToast(null)}
              className="text-muted hover:text-charcoal text-xs p-1 rounded-md"
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

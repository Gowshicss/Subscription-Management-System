import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Admin & Staff Pages
import { AdminDashboard } from '../pages/dashboard/AdminDashboard';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { ProductsPage } from '../pages/products/ProductsPage';
import { PlansPage } from '../pages/plans/PlansPage';
import { QuotationsPage } from '../pages/quotations/QuotationsPage';
import { SubscriptionsPage } from '../pages/subscriptions/SubscriptionsPage';
import { InvoicesPage } from '../pages/invoices/InvoicesPage';
import { PaymentsPage } from '../pages/payments/PaymentsPage';
import { DiscountsPage } from '../pages/discounts/DiscountsPage';
import { TaxesPage } from '../pages/taxes/TaxesPage';
import { StaffPage } from '../pages/staff/StaffPage';
import { SettingsPage } from '../pages/settings/SettingsPage';

// Customer Portal Pages
import { CustomerDashboard } from '../pages/portal/CustomerDashboard';
import { MyQuotationsPage } from '../pages/portal/MyQuotationsPage';
import { MySubscriptionsPage } from '../pages/portal/MySubscriptionsPage';
import { MyInvoicesPage } from '../pages/portal/MyInvoicesPage';
import { PaymentHistoryPage } from '../pages/portal/PaymentHistoryPage';
import { ProfilePage } from '../pages/portal/ProfilePage';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'STAFF' | 'CUSTOMER')[];
}> = ({ children, allowedRoles }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F8F9] text-xs font-bold text-plum uppercase tracking-wider">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'CUSTOMER' ? '/portal' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { user, role } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin and Staff Workspace */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="taxes" element={<TaxesPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Customer Self-Service Portal */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="quotations" element={<MyQuotationsPage />} />
        <Route path="subscriptions" element={<MySubscriptionsPage />} />
        <Route path="invoices" element={<MyInvoicesPage />} />
        <Route path="payments" element={<PaymentHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback Root Redirect */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={role === 'CUSTOMER' ? '/portal' : '/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};


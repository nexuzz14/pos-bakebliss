import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CashierPage } from './pages/CashierPage';
import { ProductsPage } from './pages/ProductsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BluetoothPrinterService } from './services/bluetoothPrinterService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CashFlowPage } from './pages/CashFlowPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { UsersPage } from './pages/UsersPage';
import { Layout } from './components/Layout';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If user doesn't have the required role, redirect them to a default safe page
    return <Navigate to="/cashier" replace />;
  }

  return children;
};

export default function App() {
  const [printerService] = useState(new BluetoothPrinterService());
  const [printerConnected, setPrinterConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const autoConnectPrinter = async () => {
    if (printerService.isSupported()) {
      const connected = await printerService.autoConnect();
      setPrinterConnected(connected);
    }
  };

  useEffect(() => {
    (async () => {
      await autoConnectPrinter();
    })();
  }, []);

  const connectPrinter = async () => {
    setLoading(true);
    const connected = await printerService.connect();
    setPrinterConnected(connected);
    setLoading(false);

    showToast(
      connected ? 'Printer berhasil terhubung!' : 'Gagal menghubungkan printer',
      connected ? 'success' : 'error'
    );
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes inside Layout */}
          <Route 
            element={
              <ProtectedRoute>
                <Layout 
                  printerService={printerService} 
                  printerConnected={printerConnected} 
                  connectPrinter={connectPrinter}
                  loading={loading}
                  toast={toast}
                  setToast={setToast}
                />
              </ProtectedRoute>
            }
          >
            {/* Dashboard: Admin & Manager only */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />

            {/* Cashier: Admin, Manager, Cashier */}
            <Route 
              path="/cashier" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <CashierPage
                    printerService={printerService}
                    printerConnected={printerConnected}
                    onShowToast={showToast}
                  />
                </ProtectedRoute>
              } 
            />

            {/* Menu Management: Admin & Manager only */}
            <Route 
              path="/menu" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ProductsPage onShowToast={showToast} />
                </ProtectedRoute>
              } 
            />

            {/* Transactions: Admin, Manager, Cashier */}
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <TransactionsPage />
                </ProtectedRoute>
              } 
            />

            {/* Cash Flow: Admin & Manager only */}
            <Route 
              path="/cashflow" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <CashFlowPage />
                </ProtectedRoute>
              } 
            />

            {/* Ingredients: Admin & Manager only */}
            <Route 
              path="/ingredients" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <IngredientsPage />
                </ProtectedRoute>
              } 
            />

            {/* Users: Admin only */}
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/cashier" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

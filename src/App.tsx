import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Invoices from "./pages/Invoices";
import Collection from "./pages/Collection";
import CollectionKanban from "./pages/CollectionKanban";
import Reconciliation from "./pages/Reconciliation";
import Import from "./pages/Import";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Layout wrapper for protected routes
function ProtectedLayout({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: ('admin' | 'supervisor' | 'cobrador')[] }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected routes with layout */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              } 
            />
            
            <Route 
              path="/customers" 
              element={
                <ProtectedLayout>
                  <Customers />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/customers/:id" 
              element={
                <ProtectedLayout>
                  <CustomerDetail />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/invoices" 
              element={
                <ProtectedLayout>
                  <Invoices />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/collection" 
              element={
                <ProtectedLayout>
                  <Collection />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/collection/kanban" 
              element={
                <ProtectedLayout>
                  <CollectionKanban />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/reconciliation" 
              element={
                <ProtectedLayout allowedRoles={['admin', 'supervisor']}>
                  <Reconciliation />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/import" 
              element={
                <ProtectedLayout allowedRoles={['admin']}>
                  <Import />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/reports" 
              element={
                <ProtectedLayout allowedRoles={['admin', 'supervisor']}>
                  <Reports />
                </ProtectedLayout>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedLayout allowedRoles={['admin']}>
                  <Settings />
                </ProtectedLayout>
              } 
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

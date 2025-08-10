import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Suspense, lazy } from "react";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminReports from "./pages/admin/Reports";

const queryClient = new QueryClient();

const ReportPage = lazy(() => import("./pages/Report"));
const TrackPage = lazy(() => import("./pages/Track"));
const MyReportsPage = lazy(() => import("./pages/MyReports"));
const NotificationsPage = lazy(() => import("./pages/Notifications"));
const AboutPage = lazy(() => import("./pages/About"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="reports" element={<AdminReports />} />
            <Route index element={<AdminDashboard />} />
          </Route>
          
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route
            path="/signaler"
            element={
              <Suspense fallback={<div className="p-6">Chargement...</div>}>
                <ReportPage />
              </Suspense>
            }
          />
          <Route
            path="/suivi"
            element={
              <Suspense fallback={<div className="p-6">Chargement...</div>}>
                <TrackPage />
              </Suspense>
            }
          />
          <Route
            path="/mes-signalements"
            element={
              <Suspense fallback={<div className="p-6">Chargement...</div>}>
                <MyReportsPage />
              </Suspense>
            }
          />
          <Route
            path="/notifications"
            element={
              <Suspense fallback={<div className="p-6">Chargement...</div>}>
                <NotificationsPage />
              </Suspense>
            }
          />
          <Route
            path="/a-propos"
            element={
              <Suspense fallback={<div className="p-6">Chargement...</div>}>
                <AboutPage />
              </Suspense>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

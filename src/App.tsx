import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Suspense, lazy } from "react";

const queryClient = new QueryClient();

const ReportPage = lazy(() => import("./pages/Report"));
const TrackPage = lazy(() => import("./pages/Track"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

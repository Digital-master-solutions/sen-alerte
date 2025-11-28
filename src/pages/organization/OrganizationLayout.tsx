import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrganizationSidebar } from "@/components/organization/OrganizationSidebar";
import { useAuthStore } from "@/stores";

export default function OrganizationLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, userType, isLoading } = useAuthStore();

  useEffect(() => {
    document.title = "Espace Organisation | SenAlert";
  }, []);

  useEffect(() => {
    // Wait for auth to initialize before redirecting
    if (!isLoading && (!isAuthenticated || userType !== 'organization')) {
      navigate("/organization/login");
    }
  }, [navigate, isAuthenticated, userType, isLoading]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <OrganizationSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 sm:h-16 border-b bg-background flex items-center px-4 sm:px-6">
            <SidebarTrigger className="mr-2 sm:mr-4" />
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold">Espace Organisation</h1>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-muted/10 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
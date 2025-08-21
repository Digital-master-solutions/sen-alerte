import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrganizationSidebar } from "@/components/organization/OrganizationSidebar";
import { useAuthStore } from "@/stores";

export default function OrganizationLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, userType, isSessionValid } = useAuthStore();

  useEffect(() => {
    document.title = "Espace Organisation | SenAlert";
  }, []);

  useEffect(() => {
    // Check authentication with Zustand store only - no localStorage fallback
    if (!isAuthenticated || userType !== 'organization' || !isSessionValid()) {
      navigate("/organization/login");
    }
  }, [navigate, isAuthenticated, userType, isSessionValid]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <OrganizationSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Espace Organisation</h1>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-muted/10">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
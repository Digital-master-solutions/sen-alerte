import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OrganizationSidebar } from "@/components/organization/OrganizationSidebar";
import { supabase } from "@/integrations/supabase/client";

export default function OrganizationLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Espace Organisation | SenAlert";
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const orgSession = localStorage.getItem('organization_session');
      if (!orgSession) {
        navigate("/organization/login");
        return;
      }
      
      try {
        const session = JSON.parse(orgSession);
        // Vérifier que la session n'est pas expirée (optionnel, ici 24h)
        const loginTime = new Date(session.logged_in_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          localStorage.removeItem('organization_session');
          navigate("/organization/login");
        }
      } catch (error) {
        localStorage.removeItem('organization_session');
        navigate("/organization/login");
      }
    };
    checkAuth();
  }, [navigate]);

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
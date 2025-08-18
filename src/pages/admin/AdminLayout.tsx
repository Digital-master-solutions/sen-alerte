import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { isAdmin, isLoading, user } = useAdminAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !isAdmin) {
        navigate("/admin/login");
      }
    }
  }, [isAdmin, isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-background flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Panneau d'administration</h1>
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
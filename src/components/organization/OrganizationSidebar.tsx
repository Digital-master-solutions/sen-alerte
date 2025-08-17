import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, FileText, Building2, Bell, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

const mainItems = [{
  title: "Tableau de bord",
  url: "/organization/dashboard",
  icon: LayoutDashboard
}, {
  title: "Signalements",
  url: "/organization/reports",
  icon: FileText
}, {
  title: "Notifications",
  url: "/organization/notifications",
  icon: Bell
}, {
  title: "Paramètres",
  url: "/organization/settings",
  icon: Settings
}];

export function OrganizationSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [orgUser, setOrgUser] = useState<any>(null);

  useEffect(() => {
    const loadOrgInfo = async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        const uid = s.session?.user.id;
        if (!uid) return;

        const { data: orgRow } = await supabase
          .from("organizations")
          .select("id,name")
          .eq("supabase_user_id", uid)
          .maybeSingle();
        
        if (orgRow) setOrgUser(orgRow);
      } catch (e) {
        console.error("Error loading org info:", e);
      }
    };
    loadOrgInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès"
    });
    navigate("/organization/login");
  };

  const linkClasses = (active: boolean) => [
    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
    active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-primary"
  ].join(" ");

  return (
    <Sidebar className={collapsed ? "w-16 overflow-hidden border-r border-sidebar-border" : "w-64 overflow-hidden border-r border-sidebar-border"} collapsible="icon">
      <SidebarContent className="bg-sidebar-background text-sidebar-foreground">
        {/* En-tête simple */}
        <SidebarHeader className="sticky top-0 z-10 bg-sidebar-background border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-base font-semibold">Organisation</h2>
                {orgUser && (
                  <div className="text-xs text-sidebar-foreground/60">
                    {orgUser.name}
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <div className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-wider text-sidebar-foreground/60 px-2">
              NAVIGATION
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {mainItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) => linkClasses(isActive)}
                        title={item.title}
                      >
                        <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : ""}`} />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Pied avec déconnexion */}
        <SidebarFooter className="sticky bottom-0 bg-sidebar-background border-t border-sidebar-border p-3">
          <Button onClick={handleLogout} variant="ghost" className={`w-full ${collapsed ? "justify-center" : "justify-start"} text-destructive hover:text-destructive hover:bg-destructive/10`}>
            <LogOut className={`h-4 w-4 ${collapsed ? "" : "mr-2"}`} />
            {!collapsed && <span className="font-medium">Déconnexion</span>}
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
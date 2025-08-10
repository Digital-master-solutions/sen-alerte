import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Shield,
  Tag,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainItems = [
  { title: "Tableau de bord", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Signalements", url: "/admin/reports", icon: FileText },
  { title: "Organisations", url: "/admin/organizations", icon: Building2 },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Catégories", url: "/admin/categories", icon: Tag },
];

const settingsItems = [
  { title: "Paramètres", url: "/admin/settings", icon: UserCog },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const admin = localStorage.getItem("adminUser");
    if (admin) {
      setAdminUser(JSON.parse(admin));
    }
  }, []);

  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
      : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-primary transition-all duration-200";

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    navigate("/admin/login");
  };

  return (
    <Sidebar className={collapsed ? "w-16 overflow-hidden border-r border-sidebar-border" : "w-72 overflow-hidden border-r border-sidebar-border"} collapsible="icon">
      <SidebarContent className="bg-sidebar-background overflow-y-auto">
        {/* Header moderne */}
        <SidebarHeader className="sticky top-0 z-10 p-6 border-b border-sidebar-border bg-sidebar-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">Administration</h2>
                {adminUser && (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs bg-sidebar-primary text-sidebar-primary-foreground">
                        {adminUser.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-sidebar-foreground/70 truncate font-medium">
                      {adminUser.name}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarHeader>

        {/* Navigation principale */}
        <div className="flex-1 px-4 py-6 space-y-2">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-3">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        title={item.title}
                        className={({ isActive }) => `
                          group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                          ${isActive 
                            ? "active bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md" 
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-primary"
                          }
                        `}
                      >
                        <item.icon className={`h-5 w-5 ${collapsed ? "mx-auto" : ""}`} />
                        {!collapsed && <span className="font-medium text-sidebar-foreground group-[.active]:text-sidebar-primary-foreground">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Paramètres */}
          <SidebarGroup className="mt-8">
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 mb-3">
              Système
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {settingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url}
                        title={item.title}
                        className={({ isActive }) => `
                          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                          ${isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-md" 
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-primary"
                          }
                        `}
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

        {/* Footer avec déconnexion */}
        <SidebarFooter className="sticky bottom-0 p-4 border-t border-sidebar-border bg-sidebar-accent/30">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 ${
              collapsed ? "p-2" : "px-3 py-2"
            }`}
          >
            <LogOut className={`h-4 w-4 ${collapsed ? "mx-auto" : "mr-3"}`} />
            {!collapsed && <span className="font-medium">Déconnexion</span>}
          </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
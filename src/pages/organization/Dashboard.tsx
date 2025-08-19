import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  Bell,
  RefreshCw,
} from "lucide-react";

interface Org { 
  id: string; 
  name: string; 
}

interface DashboardStats {
  total: number;
  inProgress: number;
  resolved: number;
  pending: number;
}

interface RecentMessage {
  id: string;
  title: string;
  message: string;
  sender_type: string;
  created_at: string;
}

export default function OrganizationDashboard() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, inProgress: 0, resolved: 0, pending: 0 });
  
  const [notifCount, setNotifCount] = useState<number>(0);

  useEffect(() => {
    document.title = "Tableau de bord | Organisation";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const orgSession = localStorage.getItem('organization_session');
      if (!orgSession) throw new Error("Non authentifié");

      const session = JSON.parse(orgSession);
      console.log("Loading organization data from session:", session);
      
      if (!session.id) throw new Error("Organisation introuvable");
      setOrg({ id: session.id, name: session.name });

      // Charger les statistiques des signalements
      const { data: repAll } = await supabase
        .from("reports")
        .select("id,status")
        .eq("assigned_organization_id", session.id);

      const total = repAll?.length || 0;
      const pending = repAll?.filter(r => r.status === 'en-attente').length || 0;
      const inProgress = repAll?.filter(r => r.status === 'en-cours').length || 0;
      const resolved = repAll?.filter(r => r.status === 'resolu').length || 0;
      setStats({ total, pending, inProgress, resolved });


      // Compter les notifications envoyées
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true });
      setNotifCount(count || 0);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Organisation introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Votre compte n'est lié à aucune organisation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bienvenue, {org.name}</h1>
            <p className="text-muted-foreground">Vue d'ensemble de vos activités récentes</p>
          </div>
          <Button onClick={load} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total assignés</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Signalements gérés</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">En attente</CardTitle>
            <Clock className="h-4 w-4 text-admin-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-warning">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">À traiter</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">En cours</CardTitle>
            <Clock className="h-4 w-4 text-admin-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-info">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">En traitement</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-admin-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-success">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Terminés</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Card */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance
            </CardTitle>
            <CardDescription>Votre efficacité de résolution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground">Taux de résolution</span>
                <span className="font-medium text-foreground">{resolutionRate}%</span>
              </div>
              <Progress value={resolutionRate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-accent/30 rounded-lg border border-border">
                <div className="text-xl font-bold text-admin-warning">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">En attente</div>
              </div>
              <div className="text-center p-4 bg-accent/30 rounded-lg border border-border">
                <div className="text-xl font-bold text-admin-info">{stats.inProgress}</div>
                <div className="text-sm text-muted-foreground">En cours</div>
              </div>
              <div className="text-center p-4 bg-accent/30 rounded-lg border border-border">
                <div className="text-xl font-bold text-admin-success">{stats.resolved}</div>
                <div className="text-sm text-muted-foreground">Résolus</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <div className="space-y-6">
          {/* Notifications Stats */}
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Messages envoyés aux citoyens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{notifCount}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Total des notifications envoyées
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
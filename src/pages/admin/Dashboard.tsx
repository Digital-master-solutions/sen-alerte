import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  TrendingUp,
  MapPin,
} from "lucide-react";

interface DashboardStats {
  pending_reports: number;
  in_progress_reports: number;
  resolved_reports: number;
  rejected_reports: number;
  total_reports: number;
  avg_resolution_hours: number;
  today_reports: number;
  week_reports: number;
}

interface RecentReport {
  id: string;
  type: string;
  status: string;
  created_at: string;
  department: string;
  priority: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // 1) Utiliser la fonction RPC get_dashboard_stats
      const { data: statsData, error: dsError } = await supabase
        .rpc("get_dashboard_stats");

      if (statsData && !dsError) {
        setStats(statsData as unknown as DashboardStats);
      } else {
        // 2) Fallback: calculer à partir de la table reports
        const { data: allReports, error: repError } = await supabase
          .from("reports")
          .select("status, actual_resolution_time, created_at")
          .order("created_at", { ascending: false });

        if (!repError && allReports) {
          const total = allReports.length;
          const pending = allReports.filter(r => r.status === "en-attente").length;
          const inProgress = allReports.filter(r => r.status === "en-cours").length;
          const resolved = allReports.filter(r => r.status === "resolu").length;
          const rejected = allReports.filter(r => r.status === "rejete").length;
          const avgHours = (() => {
            const vals = allReports
              .map(r => (r as any).actual_resolution_time)
              .filter(Boolean)
              .map((iv: string) => {
                // Postgrest renvoie souvent les intervals en format "HH:MM:SS"
                const [h, m, s] = iv.split(":").map(Number);
                return h + m / 60 + (s || 0) / 3600;
              });
            if (!vals.length) return 0;
            return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length));
          })();
          const today = allReports.filter(r => new Date(r.created_at).toDateString() === new Date().toDateString()).length;
          const week = allReports.filter(r => new Date(r.created_at) >= new Date(Date.now() - 7 * 24 * 3600 * 1000)).length;

          setStats({
            pending_reports: pending,
            in_progress_reports: inProgress,
            resolved_reports: resolved,
            rejected_reports: rejected,
            total_reports: total,
            avg_resolution_hours: avgHours,
            today_reports: today,
            week_reports: week,
          });
        }
      }

      // 3) Derniers signalements
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, type, status, created_at, department, priority")
        .order("created_at", { ascending: false })
        .limit(5);
      if (reportsData) setRecentReports(reportsData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "en-attente": { 
        variant: "secondary" as const, 
        colorClass: "bg-admin-warning", 
        label: "En attente" 
      },
      "en-cours": { 
        variant: "default" as const, 
        colorClass: "bg-admin-info", 
        label: "En cours" 
      },
      "resolu": { 
        variant: "default" as const, 
        colorClass: "bg-admin-success", 
        label: "Résolu" 
      },
      "rejete": { 
        variant: "destructive" as const, 
        colorClass: "bg-admin-danger", 
        label: "Rejeté" 
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["en-attente"];

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.colorClass}`} />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { colorClass: "bg-gray-500", label: "Faible" },
      normal: { colorClass: "bg-admin-info", label: "Normal" },
      high: { colorClass: "bg-admin-warning", label: "Élevé" },
      urgent: { colorClass: "bg-admin-danger", label: "Urgent" },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.colorClass}`} />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
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

  const resolutionRate = stats ? 
    Math.round((stats.resolved_reports / stats.total_reports) * 100) : 0;

  return (
    <div className="p-6 pl-4 md:pl-6 lg:pl-8 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="space-y-2 ml-6 sm:ml-8 lg:ml-0">
        <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des signalements et statistiques
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">En attente</CardTitle>
            <Clock className="h-4 w-4 text-admin-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-warning">
              {stats?.pending_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Signalements à traiter
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">En cours</CardTitle>
            <AlertTriangle className="h-4 w-4 text-admin-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-info">
              {stats?.in_progress_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En cours de traitement
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-admin-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-admin-success">
              {stats?.resolved_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Problèmes résolus
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats?.total_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tous les signalements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Card */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance
            </CardTitle>
            <CardDescription>
              Métriques de résolution des signalements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground">Taux de résolution</span>
                <span className="font-medium text-foreground">{resolutionRate}%</span>
              </div>
              <Progress value={resolutionRate} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-accent/30 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">
                  {stats?.today_reports || 0}
                </div>
                <div className="text-sm text-muted-foreground">Aujourd'hui</div>
              </div>
              <div className="text-center p-4 bg-accent/30 rounded-lg border border-border">
                <div className="text-2xl font-bold text-primary">
                  {stats?.week_reports || 0}
                </div>
                <div className="text-sm text-muted-foreground">Cette semaine</div>
              </div>
            </div>

            {stats?.avg_resolution_hours && (
              <div className="text-center p-4 bg-accent/30 rounded-lg border border-border">
                <div className="text-lg font-semibold text-foreground">
                  {Math.round(stats.avg_resolution_hours)}h
                </div>
                <div className="text-sm text-muted-foreground">
                  Temps moyen de résolution
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Signalements récents
            </CardTitle>
            <CardDescription>
              Les 5 derniers signalements reçus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-accent/20 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-foreground truncate">{report.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.department} • {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {getPriorityBadge(report.priority)}
                    {getStatusBadge(report.status)}
                  </div>
                </div>
              ))}
              
              {recentReports.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun signalement récent
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
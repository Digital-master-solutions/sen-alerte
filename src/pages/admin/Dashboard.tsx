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
      // Load dashboard stats
      const { data: statsData } = await supabase
        .from("dashboard_stats")
        .select("*")
        .single();

      if (statsData) {
        setStats(statsData);
      }

      // Load recent reports
      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, type, status, created_at, department, priority")
        .order("created_at", { ascending: false })
        .limit(5);

      if (reportsData) {
        setRecentReports(reportsData);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "en-attente": "secondary",
      "en-cours": "default",
      "resolu": "default",
      "rejete": "destructive",
    } as const;

    const colors = {
      "en-attente": "bg-yellow-500",
      "en-cours": "bg-blue-500",
      "resolu": "bg-green-500",
      "rejete": "bg-red-500",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        <div className={`w-2 h-2 rounded-full mr-1 ${colors[status as keyof typeof colors]}`} />
        {status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-500",
      normal: "bg-blue-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };

    return (
      <Badge variant="outline">
        <div className={`w-2 h-2 rounded-full mr-1 ${colors[priority as keyof typeof colors]}`} />
        {priority}
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble des signalements et statistiques
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pending_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Signalements à traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.in_progress_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              En cours de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.resolved_reports || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Problèmes résolus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Métriques de résolution des signalements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Taux de résolution</span>
                <span className="font-medium">{resolutionRate}%</span>
              </div>
              <Progress value={resolutionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats?.today_reports || 0}
                </div>
                <div className="text-sm text-muted-foreground">Aujourd'hui</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {stats?.week_reports || 0}
                </div>
                <div className="text-sm text-muted-foreground">Cette semaine</div>
              </div>
            </div>

            {stats?.avg_resolution_hours && (
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-lg font-semibold">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Signalements récents
            </CardTitle>
            <CardDescription>
              Les 5 derniers signalements reçus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{report.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.department} • {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
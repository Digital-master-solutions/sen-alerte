import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useReportsStore, useAuthStore } from "@/stores";
import { useMobileOptimization } from "@/hooks/use-mobile";
import { Search, RefreshCw, CheckCircle, Filter, ArrowLeft } from "lucide-react";
import { ReportCard } from "@/components/organization/ReportCard";
import { Link } from "react-router-dom";

interface Org { 
  id: string; 
  name: string; 
  email: string;
}

interface LocalReport {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  address: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  audio_url?: string;
  anonymous_code?: string;
  assigned_organization_id?: string;
}

export default function ManagedReports() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<LocalReport | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const { isMobile, mobileClasses } = useMobileOptimization();

  const { 
    managedReports, 
    isLoadingManaged,
    loadManagedReports,
    updateReportStatus
  } = useReportsStore();

  useEffect(() => {
    document.title = "Mes signalements | Organisation";
    loadAll();
  }, []);

  const { user, userType } = useAuthStore();

  const loadAll = async () => {
    setLoading(true);
    try {
      if (userType !== 'organization' || !user) {
        throw new Error("Non authentifié");
      }

      const orgData = { id: user.id, name: user.name, email: user.email };
      setOrg(orgData);

      await loadManagedReports(user.id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      await updateReportStatus(reportId, newStatus);
      toast({ 
        title: "Statut mis à jour", 
        description: `Signalement marqué comme ${newStatus}` 
      });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error.message 
      });
    }
  };

  const filteredReports = useMemo(() => {
    let filtered = managedReports;
    
    if (search) {
      filtered = filtered.filter(r =>
        r.type.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.address?.toLowerCase().includes(search.toLowerCase()) ||
        r.department?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    return filtered;
  }, [managedReports, search, statusFilter]);

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, page]);

  const totalPages = Math.ceil(filteredReports.length / pageSize);

  if (loading || isLoadingManaged) {
    return (
      <div className={`${mobileClasses.container} space-y-6`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-12 bg-muted rounded" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className={mobileClasses.container}>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Organisation introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Impossible de charger votre profil d'organisation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Stats
  const stats = {
    total: managedReports.length,
    pending: managedReports.filter(r => r.status === "en-attente").length,
    inProgress: managedReports.filter(r => r.status === "en-cours").length,
    resolved: managedReports.filter(r => r.status === "resolu").length,
  };

  return (
    <div className={`${mobileClasses.container} space-y-4 md:space-y-6 bg-background min-h-screen`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`${mobileClasses.text.title} font-bold text-foreground`}>
            Mes signalements
          </h1>
          <p className="text-muted-foreground mt-1">
            Signalements que vous gérez actuellement
          </p>
          <p className="text-sm text-muted-foreground">
            Organisation: {org.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadAll} 
            variant="outline" 
            className={`${mobileClasses.button} hidden sm:flex`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button 
            asChild 
            variant="outline" 
            className={`${mobileClasses.button} hidden sm:flex`}
          >
            <Link to="/organization/available-reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Signalements disponibles
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className={`grid ${mobileClasses.grid} md:grid-cols-4 gap-4 md:gap-6`}>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-admin-warning">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-admin-info">{stats.inProgress}</div>
            <p className="text-sm text-muted-foreground">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-admin-success">{stats.resolved}</div>
            <p className="text-sm text-muted-foreground">Résolus</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <CheckCircle className="h-5 w-5 text-admin-success" />
            Rechercher et filtrer
          </CardTitle>
          <CardDescription>
            {filteredReports.length} signalement(s) que vous gérez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4`}>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par type, description ou département..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-10 ${mobileClasses.input}`}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`${mobileClasses.input} ${isMobile ? 'w-full' : 'w-48'}`}>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en-attente">En attente</SelectItem>
                <SelectItem value="en-cours">En cours</SelectItem>
                <SelectItem value="resolu">Résolu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {paginatedReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report as any}
            type="managed"
            onStatusUpdate={handleStatusUpdate}
            onReportSelect={(report) => setSelectedReport(report as LocalReport)}
          />
        ))}
        
        {filteredReports.length === 0 && (
          <Card className="border-border">
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucun signalement géré</h3>
              <p className="text-muted-foreground mb-4">
                {managedReports.length === 0 
                  ? "Vous ne gérez actuellement aucun signalement."
                  : "Aucun signalement ne correspond à vos critères de recherche."
                }
              </p>
              {managedReports.length === 0 && (
                <Button asChild>
                  <Link to="/organization/available-reports">
                    Voir les signalements disponibles
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} />
              <PaginationItem>
                <span className="px-3 py-2 text-sm">Page {page} / {totalPages}</span>
              </PaginationItem>
              <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Mobile Actions */}
      {isMobile && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
          <Button 
            onClick={loadAll} 
            variant="outline" 
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button 
            asChild 
            variant="outline" 
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <Link to="/organization/available-reports">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
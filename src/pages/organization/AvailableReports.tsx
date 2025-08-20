import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useReportsStore } from "@/stores";
import { Search, RefreshCw, FileText, ArrowRight } from "lucide-react";
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

export default function AvailableReports() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<LocalReport | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { 
    availableReports, 
    isLoadingAvailable,
    loadAvailableReports,
    claimReport,
    addReport
  } = useReportsStore();

  useEffect(() => {
    document.title = "Signalements disponibles | Organisation";
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const orgSession = localStorage.getItem('organization_session');
      if (!orgSession) throw new Error("Non authentifié");

      const session = JSON.parse(orgSession);
      console.log("Loading organization data from session:", session);
      
      if (!session.id) throw new Error("Organisation introuvable");
      const orgData = { id: session.id, name: session.name, email: session.email };
      setOrg(orgData);

      await loadAvailableReports(orgData.id);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReport = async (report: LocalReport) => {
    if (!org) return;
    
    try {
      const updatedReport = await claimReport(report.id, org.id);
      if (updatedReport) {
        toast({
          title: "Signalement pris en charge",
          description: `Le signalement "${report.type}" a été assigné à votre organisation.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de prendre en charge ce signalement"
      });
    }
  };

  const filteredReports = useMemo(() => {
    return availableReports.filter(r =>
      r.type.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.department?.toLowerCase().includes(search.toLowerCase())
    );
  }, [availableReports, search]);

  if (loading || isLoadingAvailable) {
    return (
      <div className="p-6 space-y-6">
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
      <div className="p-6">
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

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const paginatedReports = filteredReports.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Signalements disponibles</h1>
          <p className="text-muted-foreground mt-1">
            Signalements que vous pouvez prendre en charge dans vos catégories
          </p>
          <p className="text-sm text-muted-foreground">
            Organisation: {org.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button asChild variant="outline">
            <Link to="/organization/managed-reports">
              Mes signalements
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Rechercher et filtrer
          </CardTitle>
          <CardDescription>
            {filteredReports.length} signalement(s) disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par type, description ou département..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {paginatedReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report as any}
            type="available"
            onClaim={handleClaimReport}
            onReportSelect={(report) => setSelectedReport(report as LocalReport)}
          />
        ))}
        
        {filteredReports.length === 0 && (
          <Card className="border-border">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Aucun signalement disponible</h3>
              <p className="text-muted-foreground">
                Il n'y a actuellement aucun signalement disponible dans vos catégories.
              </p>
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
    </div>
  );
}
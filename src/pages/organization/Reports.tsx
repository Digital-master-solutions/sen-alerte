import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAvailableReports } from "@/hooks/useAvailableReports";
import { useManagedReports } from "@/hooks/useManagedReports";
import {
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  User,
  RefreshCw,
  FileText,
  Hand,
  CheckCircle,
} from "lucide-react";

interface Org { 
  id: string; 
  name: string; 
  email: string;
}

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  department: string;
  address: string;
  photo_url?: string;
  anonymous_code?: string;
  assigned_organization_id?: string;
}

export default function OrgReports() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchAvailable, setSearchAvailable] = useState("");
  const [searchMine, setSearchMine] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [pageAvailable, setPageAvailable] = useState(1);
  const [pageMine, setPageMine] = useState(1);
  const pageSize = 5;

  const availableReports = useAvailableReports();
  const managedReports = useManagedReports();

  useEffect(() => {
    document.title = "Signalements | Organisation";
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) throw new Error("Non authentifié");

      // Charger l'organisation
      const { data: orgRow, error: orgErr } = await supabase
        .from("organizations")
        .select("id,name,email")
        .eq("supabase_user_id", uid)
        .maybeSingle();
      if (orgErr) throw orgErr;
      if (!orgRow) throw new Error("Organisation introuvable");
      setOrg(orgRow);

      // Charger les signalements avec les hooks séparés
      await Promise.all([
        availableReports.loadReports(orgRow),
        managedReports.loadReports(orgRow.id)
      ]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReport = async (report: Report) => {
    if (!org) return;
    
    console.log("Claiming report:", report.id);
    const updatedReport = await availableReports.claimReport(report, org);
    if (updatedReport) {
      console.log("Report claimed successfully, adding to managed reports");
      managedReports.addReport(updatedReport);
      
      // Recharger les deux listes pour s'assurer de la synchronisation
      setTimeout(async () => {
        await Promise.all([
          availableReports.loadReports(org),
          managedReports.loadReports(org.id)
        ]);
      }, 1000);
    }
  };

  const filteredAvailable = useMemo(() => {
    return availableReports.reports.filter(r =>
      r.type.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      r.description.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchAvailable.toLowerCase())
    );
  }, [availableReports.reports, searchAvailable]);

  const filteredMine = useMemo(() => {
    let filtered = managedReports.reports;
    if (searchMine) {
      filtered = filtered.filter(r =>
        r.type.toLowerCase().includes(searchMine.toLowerCase()) ||
        r.description.toLowerCase().includes(searchMine.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchMine.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    return filtered;
  }, [managedReports.reports, searchMine, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants = {
      "en-attente": { color: "bg-admin-warning", text: "En attente" },
      "en-cours": { color: "bg-admin-info", text: "En cours" },
      "resolu": { color: "bg-admin-success", text: "Résolu" },
      "rejete": { color: "bg-red-500", text: "Rejeté" },
    };

    const variant = variants[status as keyof typeof variants] || variants["en-attente"];

    return (
      <Badge variant="secondary" className="gap-1">
        <div className={`w-2 h-2 rounded-full ${variant.color}`} />
        {variant.text}
      </Badge>
    );
  };

  if (loading || availableReports.loading || managedReports.loading) {
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

  const totalPagesAvailable = Math.max(1, Math.ceil(filteredAvailable.length / pageSize));
  const totalPagesMine = Math.max(1, Math.ceil(filteredMine.length / pageSize));
  const paginatedAvailable = filteredAvailable.slice((pageAvailable - 1) * pageSize, pageAvailable * pageSize);
  const paginatedMine = filteredMine.slice((pageMine - 1) * pageSize, pageMine * pageSize);

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des signalements</h1>
          <p className="text-muted-foreground">
            Organisation: {org.name}
          </p>
        </div>
        <Button onClick={loadAll} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Available Reports Section */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <FileText className="h-5 w-5 text-primary" />
            Signalements disponibles
          </CardTitle>
          <CardDescription>
            {filteredAvailable.length} signalement(s) disponibles
          </CardDescription>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchAvailable}
              onChange={(e) => setSearchAvailable(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedAvailable.map((report) => (
              <Card key={report.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-foreground">{report.type}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2">{report.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {report.department || "Non spécifié"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {report.anonymous_code || "Anonyme"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails du signalement</DialogTitle>
                            <DialogDescription>Code: {report.anonymous_code}</DialogDescription>
                          </DialogHeader>
                          {selectedReport && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Type:</strong> {selectedReport.type}
                                </div>
                                <div>
                                  <strong>Statut:</strong> {getStatusBadge(selectedReport.status)}
                                </div>
                              </div>
                              <div>
                                <strong>Description:</strong>
                                <p className="mt-1">{selectedReport.description}</p>
                              </div>
                              {selectedReport.address && (
                                <div>
                                  <strong>Adresse:</strong>
                                  <p className="mt-1">{selectedReport.address}</p>
                                </div>
                              )}
                              {selectedReport.photo_url && (
                                <div>
                                  <strong>Photo:</strong>
                                  <img
                                    src={selectedReport.photo_url}
                                    alt="Signalement"
                                    className="mt-1 rounded-lg max-h-48 object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                          >
                            <Hand className="h-4 w-4 mr-1" />
                            Gérer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la prise en charge</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir prendre en charge ce signalement "{report.type}" ? 
                              Une fois assigné, il ne sera plus disponible pour les autres organisations.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleClaimReport(report)}>
                              Confirmer la prise en charge
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredAvailable.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun signalement disponible dans vos catégories</p>
              </div>
            )}

            {totalPagesAvailable > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationPrevious onClick={() => setPageAvailable(p => Math.max(1, p - 1))} />
                    <PaginationItem>
                      <span className="px-3 py-2 text-sm">Page {pageAvailable} / {totalPagesAvailable}</span>
                    </PaginationItem>
                    <PaginationNext onClick={() => setPageAvailable(p => Math.min(totalPagesAvailable, p + 1))} />
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* My Reports Section */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <CheckCircle className="h-5 w-5 text-admin-success" />
            Mes signalements
          </CardTitle>
          <CardDescription>
            {filteredMine.length} signalement(s) que vous gérez
          </CardDescription>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchMine}
                onChange={(e) => setSearchMine(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
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
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedMine.map((report) => (
              <Card key={report.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg text-foreground">{report.type}</h3>
                        {getStatusBadge(report.status)}
                      </div>
                      
                      <p className="text-muted-foreground line-clamp-2">{report.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {report.department || "Non spécifié"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {report.anonymous_code || "Anonyme"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Détails du signalement</DialogTitle>
                            <DialogDescription>Code: {report.anonymous_code}</DialogDescription>
                          </DialogHeader>
                          {selectedReport && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <strong>Type:</strong> {selectedReport.type}
                                </div>
                                <div>
                                  <strong>Statut:</strong> {getStatusBadge(selectedReport.status)}
                                </div>
                              </div>
                              <div>
                                <strong>Description:</strong>
                                <p className="mt-1">{selectedReport.description}</p>
                              </div>
                              {selectedReport.address && (
                                <div>
                                  <strong>Adresse:</strong>
                                  <p className="mt-1">{selectedReport.address}</p>
                                </div>
                              )}
                              {selectedReport.photo_url && (
                                <div>
                                  <strong>Photo:</strong>
                                  <img
                                    src={selectedReport.photo_url}
                                    alt="Signalement"
                                    className="mt-1 rounded-lg max-h-48 object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Select value={report.status} onValueChange={(status) => managedReports.updateStatus(report.id, status)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-attente">En attente</SelectItem>
                          <SelectItem value="en-cours">En cours</SelectItem>
                          <SelectItem value="resolu">Résolu</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredMine.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun signalement en charge</p>
              </div>
            )}

            {totalPagesMine > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationPrevious onClick={() => setPageMine(p => Math.max(1, p - 1))} />
                    <PaginationItem>
                      <span className="px-3 py-2 text-sm">Page {pageMine} / {totalPagesMine}</span>
                    </PaginationItem>
                    <PaginationNext onClick={() => setPageMine(p => Math.min(totalPagesMine, p + 1))} />
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
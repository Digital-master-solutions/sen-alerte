import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Eye,
  Edit,
  MapPin,
  Clock,
  User,
  Download,
  RefreshCw,
  FileText,
} from "lucide-react";

interface Report {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  department: string;
  address: string;
  latitude: number;
  longitude: number;
  photo_url: string;
  audio_url: string;
  anonymous_code: string;
  assigned_admin_id: string;
  resolution_notes: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, statusFilter, priorityFilter]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les signalements",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.anonymous_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((report) => report.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((report) => report.priority === priorityFilter);
    }

    setFilteredReports(filtered);
  };

  const updateReportStatus = async (reportId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({
          status: newStatus,
          resolution_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      await loadReports();
      setIsDialogOpen(false);
      
      toast({
        title: "Succès",
        description: "Statut du signalement mis à jour",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      "en-attente": { color: "bg-yellow-500", text: "En attente" },
      "en-cours": { color: "bg-blue-500", text: "En cours" },
      "resolu": { color: "bg-green-500", text: "Résolu" },
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

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { color: "bg-gray-500", text: "Faible" },
      normal: { color: "bg-blue-500", text: "Normal" },
      high: { color: "bg-orange-500", text: "Élevé" },
      urgent: { color: "bg-red-500", text: "Urgent" },
    };

    const variant = variants[priority as keyof typeof variants] || variants.normal;

    return (
      <Badge variant="outline" className="gap-1">
        <div className={`w-2 h-2 rounded-full ${variant.color}`} />
        {variant.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des signalements</h1>
          <p className="text-muted-foreground">
            {filteredReports.length} signalement(s) trouvé(s)
          </p>
        </div>
        <Button onClick={loadReports} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en-attente">En attente</SelectItem>
                <SelectItem value="en-cours">En cours</SelectItem>
                <SelectItem value="resolu">Résolu</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{report.type}</h3>
                    {getStatusBadge(report.status)}
                    {getPriorityBadge(report.priority)}
                  </div>
                  
                  <p className="text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>
                  
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
                  <Dialog open={isDialogOpen && selectedReport?.id === report.id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Détails du signalement</DialogTitle>
                        <DialogDescription>
                          Code: {report.anonymous_code}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedReport && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Type</Label>
                              <p className="font-medium">{selectedReport.type}</p>
                            </div>
                            <div>
                              <Label>Statut</Label>
                              <div className="mt-1">
                                <Select
                                  value={selectedReport.status}
                                  onValueChange={(value) =>
                                    updateReportStatus(selectedReport.id, value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="en-attente">En attente</SelectItem>
                                    <SelectItem value="en-cours">En cours</SelectItem>
                                    <SelectItem value="resolu">Résolu</SelectItem>
                                    <SelectItem value="rejete">Rejeté</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Description</Label>
                            <p className="mt-1">{selectedReport.description}</p>
                          </div>
                          
                          {selectedReport.address && (
                            <div>
                              <Label>Adresse</Label>
                              <p className="mt-1">{selectedReport.address}</p>
                            </div>
                          )}
                          
                          {selectedReport.photo_url && (
                            <div>
                              <Label>Photo</Label>
                              <img
                                src={selectedReport.photo_url}
                                alt="Signalement"
                                className="mt-1 rounded-lg max-h-48 object-cover"
                              />
                            </div>
                          )}
                          
                          <div>
                            <Label>Notes de résolution</Label>
                            <Textarea
                              placeholder="Ajoutez des notes..."
                              defaultValue={selectedReport.resolution_notes || ""}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun signalement trouvé</h3>
              <p className="text-muted-foreground">
                Essayez de modifier vos filtres de recherche
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
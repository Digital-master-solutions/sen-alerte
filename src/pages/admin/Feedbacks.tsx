import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, Filter, Eye, Trash2, CheckCircle, Mail, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface Feedback {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

export default function AdminFeedbacks() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    document.title = "Feedbacks | Administration";
    loadFeedbacks();
  }, []);

  useEffect(() => {
    filterFeedbacks();
  }, [feedbacks, searchTerm, typeFilter, statusFilter]);

  const loadFeedbacks = async () => {
    try {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeedbacks(data || []);
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les feedbacks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterFeedbacks = () => {
    let filtered = feedbacks;

    if (searchTerm) {
      filtered = filtered.filter(
        (f) =>
          f.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((f) => f.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    setFilteredFeedbacks(filtered);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedbacks")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: "Le statut du feedback a été modifié",
      });

      loadFeedbacks();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce feedback ?")) return;

    try {
      const { error } = await supabase.from("feedbacks").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Feedback supprimé",
        description: "Le feedback a été supprimé avec succès",
      });

      loadFeedbacks();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le feedback",
        variant: "destructive",
      });
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      suggestion: { color: "bg-blue-500", label: "Suggestion" },
      bug: { color: "bg-red-500", label: "Bug" },
      amelioration: { color: "bg-green-500", label: "Amélioration" },
      autre: { color: "bg-gray-500", label: "Autre" },
    };
    const variant = variants[type] || variants.autre;
    return <Badge className={variant.color}>{variant.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      nouveau: { variant: "default", label: "Nouveau" },
      lu: { variant: "secondary", label: "Lu" },
      traité: { variant: "outline", label: "Traité" },
    };
    const variant = variants[status] || variants.nouveau;
    return <Badge variant={variant.variant}>{variant.label}</Badge>;
  };

  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / pageSize));
  const paginatedFeedbacks = filteredFeedbacks.slice((page - 1) * pageSize, page * pageSize);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Feedbacks</h1>
        <p className="text-muted-foreground">
          Gestion des retours utilisateurs sur la plateforme
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbacks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {feedbacks.filter((f) => f.status === "nouveau").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lus</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {feedbacks.filter((f) => f.status === "lu").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traités</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {feedbacks.filter((f) => f.status === "traité").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="suggestion">Suggestion</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="amelioration">Amélioration</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="lu">Lu</SelectItem>
                  <SelectItem value="traité">Traité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Feedbacks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des feedbacks ({filteredFeedbacks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFeedbacks.map((feedback) => (
                <TableRow key={feedback.id}>
                  <TableCell>
                    {new Date(feedback.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getTypeBadge(feedback.type)}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate flex-1">
                        {feedback.message.length > 50 
                          ? `${feedback.message.substring(0, 50)}...` 
                          : feedback.message}
                      </span>
                       {feedback.message.length > 50 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => navigate(`/securepass/feedbacks/${feedback.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {feedback.name && <div>{feedback.name}</div>}
                      {feedback.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {feedback.email}
                        </div>
                      )}
                      {feedback.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {feedback.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/securepass/feedbacks/${feedback.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {feedback.status !== "lu" && (
                          <DropdownMenuItem onClick={() => updateStatus(feedback.id, "lu")}>
                            <Eye className="mr-2 h-4 w-4" />
                            Marquer comme lu
                          </DropdownMenuItem>
                        )}
                        {feedback.status !== "traité" && (
                          <DropdownMenuItem onClick={() => updateStatus(feedback.id, "traité")}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Marquer comme traité
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => deleteFeedback(feedback.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFeedbacks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun feedback trouvé
            </div>
          )}

          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                <PaginationItem>
                  <span className="px-3 py-2 text-sm">
                    Page {page} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

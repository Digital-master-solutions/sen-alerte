import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  Phone,
  Mail,
  Plus,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  type: string;
  status: string;
  created_at: string;
  is_active: boolean;
}

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgData, setNewOrgData] = useState({
    name: "",
    type: "Mairie",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
  });
  const [creatingOrg, setCreatingOrg] = useState(false);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    document.title = "Organisations | Administration";
    checkAuthAndLoadOrganizations();
  }, []);

  const checkAuthAndLoadOrganizations = async () => {
    try {
      await loadOrganizations();
    } catch (error: any) {
      console.error("Auth check error:", error);
      toast({
        title: "Erreur d'authentification",
        description: "Impossible de charger les organisations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm, statusFilter]);

  const loadOrganizations = async () => {
    try {
      // Direct access via JWT authentication - no localStorage needed
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error:", error);
        throw new Error(`Erreur de base de données: ${error.message}`);
      }
      
      if (data) {
        setOrganizations(data as any);
      }
    } catch (error: any) {
      console.error("Error loading organizations:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les organisations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = organizations;

    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(org => org.status === statusFilter);
    }

  setFilteredOrgs(filtered);
};

useEffect(() => {
  const channel = supabase
    .channel('orgs-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'organizations' }, () => {
      loadOrganizations();
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  const totalPages = Math.max(1, Math.ceil(filteredOrgs.length / pageSize));
  const paginatedOrgs = filteredOrgs.slice((page - 1) * pageSize, page * pageSize);

  const updateOrganizationStatus = async (orgId: string, newStatus: string) => {
    try {
      // Direct update via JWT authentication
      const { error } = await supabase
        .from("organizations")
        .update({ status: newStatus })
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `L'organisation a été ${newStatus === "approved" ? "approuvée" : "mise à jour"}`,
      });

      loadOrganizations();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Suspendu</Badge>;
    }

    switch (status) {
      case "approved":
        return <Badge className="bg-green-500 hover:bg-green-600">Approuvé</Badge>;
      case "pending":
        return <Badge variant="secondary">En attente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const createOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrg(true);

    try {
      // Call edge function to create organization with admin verification
      const { data, error } = await supabase.functions.invoke('create-organization-account', {
        body: {
          name: newOrgData.name,
          type: newOrgData.type,
          email: newOrgData.email,
          phone: newOrgData.phone,
          address: newOrgData.address,
          city: newOrgData.city,
          password: newOrgData.password
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Organisation créée",
        description: "L'organisation a été créée avec succès et est activée",
      });

      setNewOrgData({
        name: "",
        type: "Mairie",
        email: "",
        password: "",
        phone: "",
        address: "",
        city: "",
      });
      setCreateDialogOpen(false);
      loadOrganizations();
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'organisation",
        variant: "destructive",
      });
    } finally {
      setCreatingOrg(false);
    }
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organisations</h1>
          <p className="text-muted-foreground">
            Gestion des organisations partenaires
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Créer une organisation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {organizations.filter(o => o.status === "approved").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {organizations.filter(o => o.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspendues</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {organizations.filter(o => !o.is_active).length}
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
                  placeholder="Rechercher par nom, email ou ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des organisations ({filteredOrgs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organisation</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{org.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {org.email}
                      </div>
                      {org.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {org.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="text-sm">{org.city}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{org.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(org.status, org.is_active)}
                  </TableCell>
                  <TableCell>
                    {new Date(org.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedOrg(org)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir détails
                        </DropdownMenuItem>
                        {org.status === "approved" ? (
                          <DropdownMenuItem onClick={() => updateOrganizationStatus(org.id, "pending")}>
                            <UserX className="mr-2 h-4 w-4" />
                            Annuler l'approbation
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => updateOrganizationStatus(org.id, "approved")}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Approuver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => updateOrganizationStatus(org.id, "rejected")}>
                          <UserX className="mr-2 h-4 w-4" />
                          Rejeter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrgs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune organisation trouvée
            </div>
          ) : null}

          <div className="mt-4 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} />
                <PaginationItem>
                  <span className="px-3 py-2 text-sm">Page {page} / {totalPages}</span>
                </PaginationItem>
                <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} />
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Organization Details Dialog */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'organisation</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'organisation
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrg && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nom</label>
                  <p className="text-sm text-muted-foreground">{selectedOrg.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">{selectedOrg.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{selectedOrg.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone</label>
                  <p className="text-sm text-muted-foreground">{selectedOrg.phone || "Non renseigné"}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Adresse</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrg.address}, {selectedOrg.city}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Statut</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrg.status, selectedOrg.is_active)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Date de création</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrg.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => updateOrganizationStatus(selectedOrg.id, selectedOrg.status === "approved" ? "pending" : "approved")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {selectedOrg.status === "approved" ? "Annuler l'approbation" : "Approuver"}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => updateOrganizationStatus(selectedOrg.id, "rejected")}
                >
                  Rejeter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une organisation</DialogTitle>
            <DialogDescription>
              Créer un nouveau compte organisation pour une mairie du Sénégal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={createOrganization} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'organisation *</Label>
                <Input
                  id="name"
                  value={newOrgData.name}
                  onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                  placeholder="Mairie de..."
                  required
                  disabled={creatingOrg}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={newOrgData.type}
                  onValueChange={(value) => setNewOrgData({ ...newOrgData, type: value })}
                  disabled={creatingOrg}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mairie">Mairie</SelectItem>
                    <SelectItem value="Service technique">Service technique</SelectItem>
                    <SelectItem value="Collectivité">Collectivité</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newOrgData.email}
                  onChange={(e) => setNewOrgData({ ...newOrgData, email: e.target.value })}
                  placeholder="contact@mairie.sn"
                  required
                  disabled={creatingOrg}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newOrgData.password}
                  onChange={(e) => setNewOrgData({ ...newOrgData, password: e.target.value })}
                  placeholder="Mot de passe sécurisé"
                  required
                  minLength={8}
                  disabled={creatingOrg}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newOrgData.phone}
                  onChange={(e) => setNewOrgData({ ...newOrgData, phone: e.target.value })}
                  placeholder="+221 XX XXX XX XX"
                  disabled={creatingOrg}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <Input
                  id="city"
                  value={newOrgData.city}
                  onChange={(e) => setNewOrgData({ ...newOrgData, city: e.target.value })}
                  placeholder="Dakar"
                  required
                  disabled={creatingOrg}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={newOrgData.address}
                  onChange={(e) => setNewOrgData({ ...newOrgData, address: e.target.value })}
                  placeholder="Adresse complète"
                  disabled={creatingOrg}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creatingOrg}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={creatingOrg}>
                {creatingOrg ? "Création..." : "Créer l'organisation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
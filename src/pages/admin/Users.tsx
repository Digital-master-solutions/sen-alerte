import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, Plus, MoreHorizontal, Edit, Trash2, Shield, UserPlus, Crown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  department: string;
  status: string;
  organization_id: string;
  created_at: string;
  last_login: string;
}
interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  username: string;
  status: string;
  created_at: string;
  last_login: string;
}
export default function AdminUsers() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | SuperAdmin | null>(null);
  const [userType, setUserType] = useState<"admin" | "superadmin">("superadmin");
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    department: "",
    password: "",
    organization_id: ""
  });
  useEffect(() => {
    loadUsers();
  }, []);
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load super admins from superadmin table
      const { data: superAdminData, error: superAdminError } = await supabase
        .from("superadmin")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (superAdminError) {
        console.error("Error loading superadmins:", superAdminError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les super administrateurs",
          variant: "destructive"
        });
      } else {
        setSuperAdmins(superAdminData || []);
      }
      
      // Clear admins list since we're not using it anymore
      setAdmins([]);
      
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleCreateUser = async () => {
    try {
      // Hash password (in production, this should be done securely)
      const passwordHash = btoa(formData.password); // Simple encoding for demo

      const userData = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password_hash: passwordHash,
        status: "active"
      };
      const {
        error
      } = await supabase.from("superadmin").insert(userData);
      if (error) throw error;
      toast({
        title: "Utilisateur créé",
        description: `L'${userType === "admin" ? "administrateur" : "super administrateur"} a été créé avec succès`
      });
      setNewUserOpen(false);
      setFormData({
        name: "",
        email: "",
        username: "",
        department: "",
        password: "",
        organization_id: ""
      });
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'utilisateur",
        variant: "destructive"
      });
    }
  };
  const handleDeleteUser = async (userId: string) => {
    try {
      const {
        error
      } = await supabase.from("superadmin").update({
        status: "inactive"
      }).eq("id", userId);
      if (error) throw error;
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été désactivé"
      });
      loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive"
      });
    }
  };
  const filteredAdmins = admins.filter(admin => admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || admin.email.toLowerCase().includes(searchTerm.toLowerCase()) || admin.username.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSuperAdmins = superAdmins.filter(superAdmin => superAdmin.name.toLowerCase().includes(searchTerm.toLowerCase()) || superAdmin.email.toLowerCase().includes(searchTerm.toLowerCase()) || superAdmin.username.toLowerCase().includes(searchTerm.toLowerCase()));
  if (loading) {
    return <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>;
  }
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gestion des comptes administrateurs
          </p>
        </div>
        <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Ajouter un nouvel administrateur au système
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="userType">Type d'utilisateur</Label>
                <Select value={userType} onValueChange={value => setUserType(value as "admin" | "superadmin")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Super Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Nom complet</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({
                ...formData,
                name: e.target.value
              })} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} />
              </div>
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input id="username" value={formData.username} onChange={e => setFormData({
                ...formData,
                username: e.target.value
              })} />
              </div>
              {userType === "admin" && <div>
                  <Label htmlFor="department">Département</Label>
                  <Input id="department" value={formData.department} onChange={e => setFormData({
                ...formData,
                department: e.target.value
              })} />
                </div>}
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => setFormData({
                ...formData,
                password: e.target.value
              })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewUserOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateUser}>
                Créer l'utilisateur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {superAdmins.filter(sa => sa.status === "active").length}
            </div>
          </CardContent>
        </Card>

        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admins.filter(a => a.status === "active").length + superAdmins.filter(sa => sa.status === "active").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un utilisateur..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Super Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Super Administrateurs ({filteredSuperAdmins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuperAdmins.filter(sa => sa.status === "active").map(superAdmin => <TableRow key={superAdmin.id}>
                  <TableCell className="font-medium">{superAdmin.name}</TableCell>
                  <TableCell>{superAdmin.email}</TableCell>
                  <TableCell>{superAdmin.username}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Actif
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {superAdmin.last_login ? new Date(superAdmin.last_login).toLocaleDateString() : "Jamais connecté"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(superAdmin)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
          {filteredSuperAdmins.filter(sa => sa.status === "active").length === 0 && <div className="text-center py-8 text-muted-foreground">
              Aucun super administrateur actif trouvé
            </div>}
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        
        
      </Card>
    </div>;
}
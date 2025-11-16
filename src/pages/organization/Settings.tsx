import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";
import { Settings as SettingsIcon, Building2, Key, Save, Loader2, RefreshCw } from "lucide-react";
interface OrgProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  type: string;
  status: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}
export default function OrgSettings() {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<OrgProfile | null>(null);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });
  useEffect(() => {
    document.title = "Paramètres | Organisation";
    loadProfile();
  }, []);
  const {
    user,
    userType
  } = useAuthStore();
  const loadProfile = async () => {
    setLoading(true);
    try {
      if (userType !== 'organization' || !user) {
        throw new Error("Non authentifié");
      }
      const {
        data: orgRow,
        error
      } = await supabase.from("organizations").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      if (!orgRow) throw new Error("Organisation introuvable");
      setProfile(orgRow);
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e.message
      });
    } finally {
      setLoading(false);
    }
  };
  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from("organizations").update({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city
      }).eq("id", profile.id);
      if (error) throw error;
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées"
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e.message
      });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs"
      });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas"
      });
      return;
    }
    if (passwords.new.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit faire au moins 6 caractères"
      });
      return;
    }
    setSaving(true);
    try {
      // Vérifier d'abord que l'ancien mot de passe est correct
      const { data: authCheck, error: authError } = await supabase.rpc('authenticate_organization', {
        org_email: profile.email,
        plain_password: passwords.current
      });
      
      if (authError) throw authError;
      if (!authCheck || authCheck.length === 0) {
        throw new Error("L'ancien mot de passe est incorrect");
      }
      
      // Hash the new password properly using bcrypt
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { plain_password: passwords.new });
      
      if (hashError) throw new Error('Failed to secure password');
      
      // Update the password with proper hash
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ password_hash: hashedPassword })
        .eq('id', profile.id);
        
      if (updateError) throw updateError;
      
      setPasswords({
        current: "",
        new: "",
        confirm: ""
      });
      toast({
        title: "Mot de passe changé",
        description: "Votre nouveau mot de passe est actif"
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e.message
      });
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>;
  }
  if (!profile) {
    return <div className="p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Organisation introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Impossible de charger votre profil d'organisation.</p>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gestion de votre profil d'organisation • {profile.name}
          </p>
        </div>
        <Button onClick={loadProfile} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Informations système - Lecture seule */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informations système
                </CardTitle>
                <CardDescription>
                  Informations de votre organisation gérées par le système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <p className="text-sm text-foreground mt-1">{profile.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                    <p className={`text-sm mt-1 ${profile.status === 'approved' ? 'text-green-600' : profile.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {profile.status === 'approved' ? 'Approuvé' : profile.status === 'pending' ? 'En attente' : profile.status === 'rejected' ? 'Rejeté' : profile.status}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
                    <p className="text-sm text-foreground mt-1">
                      {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Compte actif</Label>
                  <p className={`text-sm mt-1 ${profile.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.is_active ? 'Oui' : 'Non'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Informations modifiables */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                  Informations modifiables
                </CardTitle>
                <CardDescription>
                  Modifiez les informations de votre organisation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Nom de l'organisation *</Label>
                    <Input id="name" value={profile.name} onChange={e => setProfile({
                    ...profile,
                    name: e.target.value
                  })} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email de contact *</Label>
                    <Input id="email" type="email" value={profile.email} onChange={e => setProfile({
                    ...profile,
                    email: e.target.value
                  })} className="mt-1" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" value={profile.phone || ""} onChange={e => setProfile({
                    ...profile,
                    phone: e.target.value
                  })} className="mt-1" placeholder="Ex: +33 1 23 45 67 89" />
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={profile.city || ""} onChange={e => setProfile({
                    ...profile,
                    city: e.target.value
                  })} className="mt-1" />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" value={profile.address || ""} onChange={e => setProfile({
                  ...profile,
                  address: e.target.value
                })} className="mt-1" placeholder="Adresse complète" />
                </div>
                
                <div className="flex justify-end pt-6 border-t border-border">
                  <Button onClick={saveProfile} disabled={saving} className="bg-primary hover:bg-primary/90">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Key className="h-5 w-5 text-primary" />
                Sécurité du compte
              </CardTitle>
              <CardDescription>
                Changez votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current_password">Mot de passe actuel</Label>
                  <Input id="current_password" type="password" value={passwords.current} onChange={e => setPasswords({
                  ...passwords,
                  current: e.target.value
                })} className="mt-1" />
                </div>
                
                <div>
                  <Label htmlFor="new_password">Nouveau mot de passe</Label>
                  <Input id="new_password" type="password" value={passwords.new} onChange={e => setPasswords({
                  ...passwords,
                  new: e.target.value
                })} className="mt-1" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Minimum 6 caractères
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                  <Input id="confirm_password" type="password" value={passwords.confirm} onChange={e => setPasswords({
                  ...passwords,
                  confirm: e.target.value
                })} className="mt-1" />
                </div>
              </div>
              
              <div className="flex justify-end pt-6 border-t border-border">
                <Button onClick={changePassword} disabled={saving || !passwords.current || !passwords.new || !passwords.confirm} variant="default" className="bg-primary hover:bg-primary/90">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
}
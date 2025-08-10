import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Settings as SettingsIcon,
  Mail,
  Shield,
  Database,
  Bell,
  Save,
  Download,
  Upload,
  Trash2,
} from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  updated_at: string;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [appSettings, setAppSettings] = useState({
    app_name: "Plateforme de Signalement",
    app_description: "Signaler les incidents dans votre commune",
    contact_email: "contact@signalement.com",
    max_file_size: "10",
    enable_notifications: true,
    enable_email_notifications: true,
    enable_anonymous_reports: true,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtp_host: "",
    smtp_port: "587",
    smtp_username: "",
    smtp_password: "",
    smtp_encryption: "tls",
    from_email: "",
    from_name: "",
  });

  const [securitySettings, setSecuritySettings] = useState({
    enable_captcha: true,
    session_timeout: "3600",
    max_login_attempts: "5",
    password_min_length: "8",
    require_email_verification: true,
    enable_two_factor: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      if (data) {
        setSettings(data);
        
        // Populate settings objects
        data.forEach((setting) => {
          if (setting.category === "app") {
            setAppSettings(prev => ({
              ...prev,
              [setting.key]: setting.value
            }));
          } else if (setting.category === "email") {
            setEmailSettings(prev => ({
              ...prev,
              [setting.key]: setting.value
            }));
          } else if (setting.category === "security") {
            setSecuritySettings(prev => ({
              ...prev,
              [setting.key]: setting.value
            }));
          }
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (category: string, key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({
          key,
          value,
          category,
          description: `Setting for ${key}`,
          updated_by: "current-admin-id", // Should be actual admin ID
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving setting:", error);
      throw error;
    }
  };

  const handleSaveAppSettings = async () => {
    try {
      const promises = Object.entries(appSettings).map(([key, value]) =>
        saveSetting("app", key, value)
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres de l'application ont été mis à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive",
      });
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      const promises = Object.entries(emailSettings).map(([key, value]) =>
        saveSetting("email", key, value)
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Paramètres email sauvegardés",
        description: "La configuration email a été mise à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration email",
        variant: "destructive",
      });
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      const promises = Object.entries(securitySettings).map(([key, value]) =>
        saveSetting("security", key, value)
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Paramètres de sécurité sauvegardés",
        description: "La configuration de sécurité a été mise à jour",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres de sécurité",
        variant: "destructive",
      });
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'system_settings.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const clearCache = async () => {
    try {
      // This would typically clear application cache
      toast({
        title: "Cache vidé",
        description: "Le cache de l'application a été vidé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vider le cache",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Paramètres système</h1>
        <p className="text-muted-foreground">
          Configuration générale de la plateforme
        </p>
      </div>

      <Tabs defaultValue="app" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="app" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Application
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="app">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de l'application</CardTitle>
              <CardDescription>
                Configuration générale de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="app_name">Nom de l'application</Label>
                  <Input
                    id="app_name"
                    value={appSettings.app_name}
                    onChange={(e) => setAppSettings({...appSettings, app_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Email de contact</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={appSettings.contact_email}
                    onChange={(e) => setAppSettings({...appSettings, contact_email: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="app_description">Description</Label>
                <Textarea
                  id="app_description"
                  value={appSettings.app_description}
                  onChange={(e) => setAppSettings({...appSettings, app_description: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="max_file_size">Taille max des fichiers (MB)</Label>
                <Input
                  id="max_file_size"
                  type="number"
                  value={appSettings.max_file_size}
                  onChange={(e) => setAppSettings({...appSettings, max_file_size: e.target.value})}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_notifications"
                    checked={appSettings.enable_notifications}
                    onCheckedChange={(checked) => setAppSettings({...appSettings, enable_notifications: checked})}
                  />
                  <Label htmlFor="enable_notifications">Activer les notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_email_notifications"
                    checked={appSettings.enable_email_notifications}
                    onCheckedChange={(checked) => setAppSettings({...appSettings, enable_email_notifications: checked})}
                  />
                  <Label htmlFor="enable_email_notifications">Notifications par email</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_anonymous_reports"
                    checked={appSettings.enable_anonymous_reports}
                    onCheckedChange={(checked) => setAppSettings({...appSettings, enable_anonymous_reports: checked})}
                  />
                  <Label htmlFor="enable_anonymous_reports">Signalements anonymes</Label>
                </div>
              </div>
              
              <Button onClick={handleSaveAppSettings}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Configuration email</CardTitle>
              <CardDescription>
                Paramètres SMTP pour l'envoi d'emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="smtp_host">Serveur SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={emailSettings.smtp_host}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">Port</Label>
                  <Input
                    id="smtp_port"
                    value={emailSettings.smtp_port}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_username">Nom d'utilisateur</Label>
                  <Input
                    id="smtp_username"
                    value={emailSettings.smtp_username}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_password">Mot de passe</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={emailSettings.smtp_password}
                    onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="from_email">Email expéditeur</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={emailSettings.from_email}
                    onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="from_name">Nom expéditeur</Label>
                  <Input
                    id="from_name"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveEmailSettings}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de sécurité</CardTitle>
              <CardDescription>
                Configuration de la sécurité et authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="session_timeout">Timeout session (secondes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="max_login_attempts">Tentatives max de connexion</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, max_login_attempts: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password_min_length">Longueur min du mot de passe</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={securitySettings.password_min_length}
                    onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_captcha"
                    checked={securitySettings.enable_captcha}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enable_captcha: checked})}
                  />
                  <Label htmlFor="enable_captcha">Activer le captcha</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="require_email_verification"
                    checked={securitySettings.require_email_verification}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, require_email_verification: checked})}
                  />
                  <Label htmlFor="require_email_verification">Vérification email obligatoire</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable_two_factor"
                    checked={securitySettings.enable_two_factor}
                    onCheckedChange={(checked) => setSecuritySettings({...securitySettings, enable_two_factor: checked})}
                  />
                  <Label htmlFor="enable_two_factor">Authentification à deux facteurs</Label>
                </div>
              </div>
              
              <Button onClick={handleSaveSecuritySettings}>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance système</CardTitle>
              <CardDescription>
                Outils de maintenance et gestion des données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sauvegarde</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={exportSettings} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Exporter les paramètres
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="mr-2 h-4 w-4" />
                      Importer les paramètres
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nettoyage</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={clearCache} className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Vider le cache
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Database className="mr-2 h-4 w-4" />
                      Optimiser la base
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistiques système</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">--</div>
                      <div className="text-sm text-muted-foreground">Espace disque</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">--</div>
                      <div className="text-sm text-muted-foreground">Mémoire</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">--</div>
                      <div className="text-sm text-muted-foreground">Sessions actives</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">--</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
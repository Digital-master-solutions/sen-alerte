import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores";
import { useMobileOptimization } from "@/hooks/use-mobile";
import {
  Bell,
  Send,
  Loader2,
  RefreshCw,
  MessageSquare,
  Calendar,
  FileText,
  Eye,
  MapPin,
  User,
} from "lucide-react";

interface Org { 
  id: string; 
  name: string; 
}

interface Report { 
  id: string; 
  anonymous_code: string | null; 
  type: string; 
  description: string;
  created_at: string; 
  status: string;
  address?: string;
  department?: string;
}

export default function OrgNotifications() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSendId, setOpenSendId] = useState<string | null>(null);
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { isMobile, mobileClasses } = useMobileOptimization();

  useEffect(() => {
    document.title = "Notifications | Organisation";
    load();
  }, []);

  const { user, userType } = useAuthStore();

  const load = async () => {
    setLoading(true);
    try {
      if (userType !== 'organization' || !user) {
        throw new Error("Non authentifié");
      }

      setOrg({ id: user.id, name: user.name });

      const { data, error } = await supabase
        .from("reports")
        .select("id,anonymous_code,type,description,created_at,status,address,department")
        .eq("assigned_organization_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data || []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const send = async (report: Report) => {
    if (!title.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs" });
      return;
    }
    
    setSending(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        title: title.trim(),
        message: message.trim(),
        type: 'info',
        anonymous_code: report.anonymous_code,
        report_id: report.id,
      } as any);
      
      if (error) throw error;
      
      toast({ title: "Notification envoyée", description: "Le citoyen pourra consulter votre message" });
      setOpenSendId(null);
      setTitle("");
      setMessage("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'en-attente': { label: 'En attente', variant: 'secondary' as const, color: 'text-yellow-600' },
      'en-cours': { label: 'En cours', variant: 'secondary' as const, color: 'text-blue-600' },
      'resolu': { label: 'Résolu', variant: 'secondary' as const, color: 'text-green-600' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const, color: 'text-gray-600' };
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className={`${mobileClasses.container} space-y-6`}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded" />
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

  return (
    <div className={`${mobileClasses.container} space-y-4 md:space-y-6 bg-background min-h-screen`}>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`${mobileClasses.text.title} font-bold text-foreground`}>
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Envoyez des messages aux citoyens concernant leurs signalements
          </p>
          <p className="text-sm text-muted-foreground">
            Organisation: {org.name}
          </p>
        </div>
        <Button 
          onClick={load} 
          variant="outline" 
          className={`${mobileClasses.button} hidden sm:flex`}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((r) => (
          <Card key={r.id} className="bg-card/80 backdrop-blur-sm border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{r.type}</span>
                  {getStatusBadge(r.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Description with truncation */}
              <div className="space-y-2">
                <p className="text-muted-foreground leading-relaxed">
                  {truncateText(r.description, 120)}
                </p>
                {r.description.length > 120 && (
                  <Dialog open={openDetailsId === r.id} onOpenChange={(o) => setOpenDetailsId(o ? r.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="link" size="sm" className="p-0 h-auto text-primary">
                        Voir plus
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Détails du signalement
                        </DialogTitle>
                        <DialogDescription>
                          Code citoyen: <span className="font-mono font-semibold">{r.anonymous_code || '—'}</span>
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Type</span>
                            <p className="font-semibold">{r.type}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Statut</span>
                            <div>{getStatusBadge(r.status)}</div>
                          </div>
                        </div>
                        
                        {r.address && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Adresse
                            </span>
                            <p className="text-sm bg-accent/20 p-2 rounded break-words">{r.address}</p>
                          </div>
                        )}
                        
                        {r.department && (
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-muted-foreground">Département</span>
                            <p className="text-sm">{r.department}</p>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Description complète</span>
                          <div className="bg-accent/10 p-4 rounded-lg border max-h-60 overflow-y-auto">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{r.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Date de création</span>
                          <p className="text-sm">{new Date(r.created_at).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {/* Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Code:</span> 
                    <span className="font-mono">{r.anonymous_code || '—'}</span>
                  </div>
                  {r.address && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{truncateText(r.address, 30)}</span>
                    </div>
                  )}
                </div>
                
                <div className={`flex ${isMobile ? 'flex-col gap-2' : 'items-center gap-2'}`}>
                  {r.description.length > 120 && (
                    <Dialog open={openDetailsId === r.id} onOpenChange={(o) => setOpenDetailsId(o ? r.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  )}
                  
                  <Dialog open={openSendId === r.id} onOpenChange={(o) => setOpenSendId(o ? r.id : null)}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className={`bg-primary hover:bg-primary/90 ${isMobile ? 'w-full' : ''}`}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer un message
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Envoyer un message au citoyen
                        </DialogTitle>
                        <DialogDescription>
                          Ce message sera visible via le code unique <span className="font-mono font-semibold">{r.anonymous_code || '—'}</span>.
                          Le citoyen pourra le consulter en saisissant ce code.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="p-3 bg-accent/10 rounded-lg border">
                          <div className="text-sm">
                            <div className="font-medium text-foreground mb-1">{r.type}</div>
                            <div className="text-muted-foreground">{truncateText(r.description, 100)}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="title">Titre du message</Label>
                            <Input 
                              id="title" 
                              value={title} 
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder="Ex: Mise à jour sur votre signalement"
                              className={mobileClasses.input}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="msg">Message</Label>
                            <Textarea 
                              id="msg" 
                              rows={4} 
                              value={message} 
                              onChange={(e) => setMessage(e.target.value)}
                              placeholder="Votre message au citoyen..."
                              className={mobileClasses.input}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            onClick={() => setOpenSendId(null)}
                            disabled={sending}
                            className={mobileClasses.button}
                          >
                            Annuler
                          </Button>
                          <Button 
                            onClick={() => send(r)}
                            disabled={!title.trim() || !message.trim() || sending}
                            className={`bg-primary hover:bg-primary/90 ${mobileClasses.button}`}
                          >
                            {sending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Envoyer
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {reports.length === 0 && (
          <Card className="bg-card/80 backdrop-blur-sm border shadow-md animate-fade-in">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Aucun signalement géré</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Vous n'avez pas encore pris en charge de signalements. 
                Consultez la section "Signalements" pour en gérer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Actions */}
      {isMobile && (
        <div className="fixed bottom-4 right-4">
          <Button 
            onClick={load} 
            variant="outline" 
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
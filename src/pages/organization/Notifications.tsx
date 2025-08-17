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

  useEffect(() => {
    document.title = "Notifications | Organisation";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) throw new Error("Non authentifié");

      const { data: orgRow, error: orgErr } = await supabase
        .from("organizations")
        .select("id,name")
        .eq("supabase_user_id", uid)
        .maybeSingle();
      if (orgErr) throw orgErr;
      if (!orgRow) throw new Error("Organisation introuvable");
      setOrg(orgRow);

      const { data, error } = await supabase
        .from("reports")
        .select("id,anonymous_code,type,description,created_at,status,address,department")
        .eq("assigned_organization_id", orgRow.id)
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
    const variants = {
      "en-attente": { color: "bg-amber-500", text: "En attente" },
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="p-6 space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive">Organisation introuvable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Impossible de charger votre profil d'organisation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
              <p className="text-muted-foreground">
                Envoyez des messages aux citoyens pour leurs signalements • {org.name}
              </p>
            </div>
            <Button onClick={load} variant="outline" className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {reports.map((r, index) => (
            <Card 
              key={r.id} 
              className="bg-card/80 backdrop-blur-sm border shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">{r.type}</span>
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
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  
                  <div className="flex items-center gap-2">
                    {r.description.length > 120 && (
                      <Dialog open={openDetailsId === r.id} onOpenChange={(o) => setOpenDetailsId(o ? r.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </DialogTrigger>
                      </Dialog>
                    )}
                    
                    <Dialog open={openSendId === r.id} onOpenChange={(o) => setOpenSendId(o ? r.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90">
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
                              />
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => setOpenSendId(null)}
                              disabled={sending}
                            >
                              Annuler
                            </Button>
                            <Button 
                              onClick={() => send(r)}
                              disabled={!title.trim() || !message.trim() || sending}
                              className="bg-primary hover:bg-primary/90"
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
      </div>
    </div>
  );
}
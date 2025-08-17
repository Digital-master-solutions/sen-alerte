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
}

export default function OrgNotifications() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
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
        .select("id,anonymous_code,type,description,created_at,status")
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
      setOpenId(null); 
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
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

  return (
    <div className="p-6 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Envoyez des messages aux citoyens pour leurs signalements • {org.name}
          </p>
        </div>
        <Button onClick={load} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((r) => (
          <Card key={r.id} className="bg-card border-border shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <span className="text-lg">{r.type}</span>
                  {getStatusBadge(r.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground line-clamp-2">{r.description}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Code citoyen:</span> {r.anonymous_code || '—'}
                  </div>
                  
                  <Dialog open={openId === r.id} onOpenChange={(o) => { setOpenId(o ? r.id : null); }}>
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
                          Ce message sera visible via le code unique <strong>{r.anonymous_code || '—'}</strong>.
                          Le citoyen pourra le consulter en saisissant ce code.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="p-3 bg-accent/10 rounded-lg border border-border">
                          <div className="text-sm">
                            <div className="font-medium text-foreground">Signalement: {r.type}</div>
                            <div className="text-muted-foreground mt-1">{r.description}</div>
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
                        
                        <div className="flex justify-end gap-2 pt-4 border-t border-border">
                          <Button 
                            variant="outline" 
                            onClick={() => setOpenId(null)}
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
          <Card className="bg-card border-border shadow-md">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Aucun signalement géré</h3>
              <p className="text-muted-foreground">
                Vous n'avez pas encore pris en charge de signalements. 
                Consultez la section "Signalements" pour en gérer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
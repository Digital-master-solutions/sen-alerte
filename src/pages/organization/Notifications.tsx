import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Search, RefreshCw, AlertCircle } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  email: string;
}

interface Report {
  id: string;
  anonymous_code: string;
  type: string;
  description: string;
  created_at: string;
  status: string;
  anonymous_name?: string;
  anonymous_phone?: string;
}

export default function OrgNotificationsSimplified() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = "Notifications | Organisation";
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) throw new Error("Non authentifié");

      // Get organization
      const { data: orgRow, error: orgErr } = await supabase
        .from("organizations")
        .select("id, name, email")
        .eq("supabase_user_id", uid)
        .maybeSingle();
      
      if (orgErr) throw orgErr;
      if (!orgRow) throw new Error("Organisation introuvable");
      setOrg(orgRow);

      // Get reports assigned to this organization
      const { data: reportsData, error: reportsErr } = await supabase
        .from("reports")
        .select("id, anonymous_code, type, description, created_at, status, anonymous_name, anonymous_phone")
        .eq("assigned_organization_id", orgRow.id)
        .order("created_at", { ascending: false });

      if (reportsErr) throw reportsErr;
      setReports(reportsData || []);
    } catch (e: any) {
      console.error("Error loading data:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: e.message
      });
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    if (!selectedReport || !message.trim() || !org) return;
    
    setSending(true);
    try {
      const { error } = await supabase.from("messagerie").insert({
        title: `Notification - ${selectedReport.type}`,
        message: message.trim(),
        type: 'notification',
        sender_type: 'organization',
        sender_id: org.id,
        sender_name: org.name,
        recipient_type: 'citizen',
        recipient_id: selectedReport.anonymous_code,
        recipient_name: selectedReport.anonymous_name || 'Citoyen',
        read: false
      });

      if (error) throw error;

      toast({
        title: "Message envoyé",
        description: `Notification envoyée pour le signalement ${selectedReport.anonymous_code}`
      });

      setMessage('');
      setSelectedReport(null);
    } catch (e: any) {
      console.error("Error sending message:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer le message"
      });
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

  const filteredReports = reports.filter(report =>
    report.type.toLowerCase().includes(search.toLowerCase()) ||
    report.description.toLowerCase().includes(search.toLowerCase()) ||
    report.anonymous_code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
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
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Organisation introuvable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Impossible de charger votre profil d'organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Organisation: {org.name} • {filteredReports.length} signalement(s) géré(s)
          </p>
        </div>
        <Button onClick={load} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un signalement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="border-border hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg text-foreground">{report.type}</h3>
                    {getStatusBadge(report.status)}
                    <Badge variant="outline">
                      {report.anonymous_code}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground line-clamp-2">{report.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Créé le {new Date(report.created_at).toLocaleDateString()}</span>
                    {report.anonymous_name && (
                      <span>Contact: {report.anonymous_name}</span>
                    )}
                  </div>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Envoyer une notification
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Envoyer une notification</DialogTitle>
                      <DialogDescription>
                        Signalement: {selectedReport?.anonymous_code} - {selectedReport?.type}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Message à envoyer au citoyen
                        </label>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Exemple: Votre signalement a été pris en compte. Nous interviendrons dans les 48h..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedReport(null);
                            setMessage('');
                          }}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={send}
                          disabled={!message.trim() || sending}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {sending ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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
            </CardContent>
          </Card>
        ))}
        
        {filteredReports.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium text-lg mb-2">Aucun signalement à notifier</h3>
              <p className="text-muted-foreground">
                {search ? "Aucun signalement ne correspond à votre recherche." : "Vous n'avez pas encore de signalements assignés."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
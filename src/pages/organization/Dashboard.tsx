import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Bell, ClipboardCheck, Loader2 } from "lucide-react";

interface Org { id: string; name: string; }

export default function OrganizationDashboard() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0 });
  const [messages, setMessages] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState<number>(0);

  useEffect(() => {
    document.title = "Tableau de bord | Organisation";
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

      const { data: repAll } = await supabase
        .from("reports")
        .select("id,status")
        .eq("assigned_organization_id", orgRow.id);

      const total = repAll?.length || 0;
      const inProgress = repAll?.filter(r => r.status === 'en-cours').length || 0;
      const resolved = repAll?.filter(r => r.status === 'resolu').length || 0;
      setStats({ total, inProgress, resolved });

      const { data: msgs } = await supabase
        .from("messagerie")
        .select("id,title,message,sender_type,recipient_type,created_at")
        .or(`sender_type.eq.organization,recipient_type.eq.organization`)
        .order("created_at", { ascending: false })
        .limit(5);
      setMessages(msgs || []);

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true });
      setNotifCount(count || 0);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
      </div>
    );
  }

  if (!org) {
    return (
      <Card>
        <CardHeader><CardTitle>Organisation introuvable</CardTitle></CardHeader>
        <CardContent>Votre compte n'est lié à aucune organisation.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bienvenue, {org.name}</h1>
        <p className="text-muted-foreground">Vue d’ensemble des activités récentes</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Signalements assignés</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.total}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>En cours</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.inProgress}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Résolus</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{stats.resolved}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Derniers messages</CardTitle>
            <CardDescription>Conversations récentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {messages.length === 0 && <p className="text-sm text-muted-foreground">Aucun message</p>}
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{m.sender_type}</Badge>
                  <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <div className="font-medium">{m.title}</div>
                <div className="text-muted-foreground line-clamp-2">{m.message}</div>
                <Separator className="my-2" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={load}>Actualiser</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle>
            <CardDescription>Total envoyées (toutes)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifCount}</div>
            <div className="text-sm text-muted-foreground mt-2">Inclut toutes les notifications existantes.</div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={load}>
                <ClipboardCheck className="h-4 w-4 mr-2" /> Rafraîchir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

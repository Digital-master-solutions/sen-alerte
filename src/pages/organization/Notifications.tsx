import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Loader2 } from "lucide-react";

interface Org { id: string; name: string; }
interface Report { id: string; anonymous_code: string | null; type: string; created_at: string; status: string; }

export default function OrgNotifications() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

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
        .select("id,anonymous_code,type,created_at,status")
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
    try {
      if (!title.trim() || !message.trim()) return;
      const { error } = await supabase.from("notifications").insert({
        title: title.trim(),
        message: message.trim(),
        type: 'info',
        anonymous_code: report.anonymous_code,
        report_id: report.id,
      } as any);
      if (error) throw error;
      toast({ title: "Notification envoyée" });
      setOpenId(null); setTitle(""); setMessage("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <Button variant="outline" onClick={load}>Rafraîchir</Button>
      </div>

      {reports.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> {r.type} • {r.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Code: {r.anonymous_code || '—'} • {new Date(r.created_at).toLocaleString()}</div>
            <div className="mt-3">
              <Dialog open={openId === r.id} onOpenChange={(o) => { setOpenId(o ? r.id : null); }}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm"><Send className="h-4 w-4 mr-2" /> Envoyer un message</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Envoyer un message au citoyen</DialogTitle>
                    <DialogDescription>Ce message sera visible via le code unique {r.anonymous_code || '—'}.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre</Label>
                      <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="msg">Message</Label>
                      <Textarea id="msg" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpenId(null)}>Annuler</Button>
                      <Button onClick={() => send(r)}><Send className="h-4 w-4 mr-2" /> Envoyer</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}

      {reports.length === 0 && (
        <Card><CardContent className="p-6">Aucun signalement géré.</CardContent></Card>
      )}
    </div>
  );
}

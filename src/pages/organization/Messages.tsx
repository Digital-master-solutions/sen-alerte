import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Send, Plus, Loader2 } from "lucide-react";

interface Org { id: string; name: string; }
interface MessageRow {
  id: string;
  title: string;
  message: string;
  sender_type: string;
  sender_id: string;
  recipient_type: string;
  recipient_id: string | null;
  created_at: string;
  parent_id: string | null;
}

export default function OrgMessages() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "Messagerie | Organisation";
    load();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      const { data: rows, error } = await supabase
        .from("messagerie")
        .select("*")
        .or(`sender_type.eq.organization,recipient_type.eq.organization`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages(rows || []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid || !org) throw new Error("Non authentifié");
      if (!input.trim()) return;

      const { error } = await supabase.from("messagerie").insert({
        title: `Message de ${org.name}`,
        message: input.trim(),
        type: 'info',
        sender_type: 'organization',
        sender_id: uid,
        sender_name: org.name,
        recipient_type: 'super_admin',
        recipient_id: 'all',
        recipient_name: 'Super Admin',
      } as any);
      if (error) throw error;
      setInput("");
      await load();
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
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> Nouveau message
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Fil de discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="min-h-[320px] max-h-[50vh] overflow-y-auto space-y-3 p-1">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun message.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`p-3 rounded-lg border ${m.sender_type === 'organization' ? 'bg-accent/40' : ''}`}>
                <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                <div className="font-medium">{m.title}</div>
                <div className="text-sm">{m.message}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="mt-4 flex gap-2">
            <Input placeholder="Votre message..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==='Enter' && send()} />
            <Button onClick={send}><Send className="h-4 w-4 mr-1" /> Envoyer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Building2,
  Crown,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Org { 
  id: string; 
  name: string; 
}

interface MessageRow {
  id: string;
  title: string;
  message: string;
  sender_type: string;
  sender_name: string;
  recipient_type: string;
  recipient_name: string;
  created_at: string;
  read: boolean;
}

export default function OrgMessages() {
  const { toast } = useToast();
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
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
    if (!input.trim() || !org || sending) return;
    
    setSending(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) throw new Error("Non authentifié");

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
        read: false,
      } as any);
      
      if (error) throw error;
      
      setInput("");
      toast({ title: "Message envoyé", description: "Votre message a été envoyé aux administrateurs" });
      await load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-96 bg-muted rounded" />
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
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messagerie</h1>
          <p className="text-muted-foreground">
            Communication avec l'administration • {org.name}
          </p>
        </div>
        <Button onClick={load} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversation Info */}
        <Card className="lg:col-span-1 bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-accent/20 rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    <Crown className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-foreground">Super Admin</div>
                  <div className="text-sm text-muted-foreground">Administration</div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Vous pouvez communiquer directement avec l'équipe d'administration via cette messagerie.</p>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages:</span>
                    <span className="font-medium">{messages.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-3 bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <MessageSquare className="h-5 w-5 text-primary" />
              Fil de discussion
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[600px]">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun message. Commencez la conversation!</p>
                  </div>
                )}
                
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender_type === 'organization' ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        m.sender_type === 'organization'
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {m.sender_type === 'organization' ? (
                              <Building2 className="h-3 w-3" />
                            ) : (
                              <Crown className="h-3 w-3" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{m.sender_name}</span>
                        <span className="text-xs opacity-70">
                          {new Date(m.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="font-medium text-sm mb-1">{m.title}</div>
                      <p className="text-sm">{m.message}</p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </ScrollArea>
            
            {/* Message Input */}
            <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                  disabled={sending}
                />
                <Button 
                  onClick={send} 
                  disabled={!input.trim() || sending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Appuyez sur Entrée pour envoyer
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
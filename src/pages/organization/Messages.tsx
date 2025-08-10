import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Clock, User } from "lucide-react";

interface Message {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  sender_type: string;
  recipient_name: string;
  recipient_type: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  reply_count: number;
  is_reply: boolean;
  parent_id: string;
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.title = "Messages | Espace Organisation";
    loadMessages();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('organization_messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messagerie' },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messagerie')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messagerie')
        .insert([
          {
            title: "Message de l'organisation",
            message: newMessage.trim(),
            sender_type: 'organization',
            sender_name: 'Organisation',
            sender_id: 'current-org-id',
            recipient_type: 'super_admin',
            recipient_name: 'Administration',
            recipient_id: 'admin',
            is_reply: false
          }
        ]);

      if (error) throw error;

      setNewMessage("");
      loadMessages();
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="grid gap-6">
        {/* Messages Thread */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Discussion avec l'Administration
            </CardTitle>
            <CardDescription>
              Échangez directement avec les administrateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages List */}
            <ScrollArea className="h-96 w-full rounded border p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun message pour le moment</p>
                    <p className="text-sm">Commencez une conversation avec l'administration</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      <div className={`flex items-start gap-3 ${
                        message.sender_type === 'organization' ? 'flex-row-reverse' : ''
                      }`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {message.sender_type === 'admin' ? 'A' : 'O'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 space-y-1 ${
                          message.sender_type === 'organization' ? 'text-right' : ''
                        }`}>
                          <div className="flex items-center gap-2">
                            <Badge variant={message.sender_type === 'admin' ? 'default' : 'secondary'}>
                              {message.sender_type === 'admin' ? 'Administrateur' : 'Organisation'}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(message.created_at).toLocaleString('fr-FR')}
                            </div>
                          </div>
                          <div className={`rounded-lg p-3 max-w-md ${
                            message.sender_type === 'organization'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Send Message */}
            <div className="space-y-2">
              <Textarea
                placeholder="Tapez votre message ici..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[100px]"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
                </p>
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || sending}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Envoi..." : "Envoyer"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages envoyés</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {messages.filter(m => m.sender_type === 'organization').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages reçus</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {messages.filter(m => m.sender_type === 'admin').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total messages</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messages.length}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
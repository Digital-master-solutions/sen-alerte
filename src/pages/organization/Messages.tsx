import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  PaperclipIcon,
} from "lucide-react";

interface Message {
  id: string;
  title: string;
  message: string;
  sender_name: string;
  sender_type: string;
  sender_id: string;
  recipient_name: string;
  recipient_type: string;
  recipient_id: string;
  read: boolean;
  created_at: string;
  reply_count: number;
  is_reply: boolean;
  parent_id: string;
}

interface Conversation {
  participant_name: string;
  participant_type: string;
  participant_id: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  messages: Message[];
}

export default function OrgMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Messages | Espace Organisation";
    loadOrganization();
  }, []);

  useEffect(() => {
    if (organization) {
      loadConversations();
      setupRealtimeSubscription();
    }
  }, [organization]);

  const setupRealtimeSubscription = () => {
    // Set up real-time subscription for messages
    const channel = supabase
      .channel('organization_messages_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messagerie',
          filter: `or(sender_type.eq.organization,recipient_type.eq.organization)`
        },
        (payload) => {
          console.log('Realtime message update:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRealtimeUpdate = async (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // Nouveau message reçu
      await loadConversations();
      
      // Mise à jour du badge si c'est un message de l'admin
      if (payload.new.sender_type === 'super_admin' && !payload.new.read) {
        setTotalUnreadCount(prev => prev + 1);
        
        // Notification toast pour nouveau message
        toast({
          title: "Nouveau message",
          description: `Message de ${payload.new.sender_name}`,
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      // Message marqué comme lu
      if (payload.new.read && !payload.old.read) {
        setTotalUnreadCount(prev => Math.max(0, prev - 1));
      }
      await loadConversations();
    }
  };

  const loadOrganization = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) return;

      const { data: org, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("supabase_user_id", session.session.user.id)
        .single();

      if (error) throw error;
      setOrganization(org);
      loadConversations();
    } catch (error) {
      console.error("Error loading organization:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'organisation",
        variant: "destructive",
      });
    }
  };

  const loadConversations = async (selectKey?: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messagerie")
        .select("*")
        .or(`sender_type.eq.organization,recipient_type.eq.organization`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation with super admin
      const conversationMap = new Map<string, Conversation>();
      let totalUnread = 0;
      
      data?.forEach((msg: Message) => {
        const key = "super_admin-admin"; // Always conversation with super admin
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            participant_name: "Administration",
            participant_type: "super_admin",
            participant_id: "admin",
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            messages: [],
          });
        }
        
        const conversation = conversationMap.get(key)!;
        conversation.messages.push(msg);
        
        // Compter seulement les messages non lus de l'admin
        if (!msg.read && msg.sender_type === "super_admin") {
          conversation.unread_count++;
          totalUnread++;
        }
        
        if (new Date(msg.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = msg.message;
          conversation.last_message_time = msg.created_at;
        }
      });

      const list = Array.from(conversationMap.values());
      setConversations(list);
      setTotalUnreadCount(totalUnread);
      
      // Auto-select the conversation with admin if there is one
      if (list.length > 0 && !selectedConversation) {
        setSelectedConversation(list[0]);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !organization || !selectedConversation) return;

    const messageText = newMessage;
    setNewMessage(""); // Clear immediately for better UX

    try {
      const { error } = await supabase
        .from("messagerie")
        .insert({
          title: "Message de l'organisation",
          message: messageText,
          sender_name: organization.name,
          sender_type: "organization",
          sender_id: organization.id,
          recipient_name: "Administration",
          recipient_type: "super_admin",
          recipient_id: "admin",
          is_reply: true,
        });

      if (error) throw error;

      // Mise à jour optimiste - ajouter le message immédiatement à l'interface
      const newMsg = {
        id: `temp-${Date.now()}`,
        title: "Message de l'organisation",
        message: messageText,
        sender_name: organization.name,
        sender_type: "organization",
        sender_id: organization.id,
        recipient_name: "Administration",
        recipient_type: "super_admin",
        recipient_id: "admin",
        read: false,
        created_at: new Date().toISOString(),
        reply_count: 0,
        is_reply: true,
        parent_id: "",
      };

      // Mettre à jour la conversation sélectionnée
      if (selectedConversation) {
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, newMsg],
          last_message: messageText,
          last_message_time: new Date().toISOString(),
        };
        setSelectedConversation(updatedConversation);
        
        // Mettre à jour aussi la liste des conversations
        setConversations(prev => 
          prev.map(conv => 
            conv.participant_id === selectedConversation.participant_id 
              ? updatedConversation 
              : conv
          )
        );
      }

      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText); // Restore message on error
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messagerie")
        .update({ read: true })
        .eq("id", messageId)
        .eq("sender_type", "super_admin"); // Only mark admin messages as read
      
      if (error) throw error;
      
      // Le realtime se chargera de mettre à jour les compteurs
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const markConversationAsRead = async (conversation: Conversation) => {
    try {
      const unreadMessages = conversation.messages.filter(
        m => !m.read && m.sender_type === "super_admin"
      );
      
      if (unreadMessages.length === 0) return;

      const { error } = await supabase
        .from("messagerie")
        .update({ read: true })
        .in("id", unreadMessages.map(m => m.id))
        .eq("sender_type", "super_admin");
      
      if (error) throw error;
      
      // Le realtime se chargera de mettre à jour les compteurs
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Messagerie</h1>
          <p className="text-muted-foreground">
            Communication avec l'administration
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non lus</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 flex items-center gap-2">
              {totalUnreadCount}
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  Nouveau
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages envoyés</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedConversation?.messages.filter(m => m.sender_type === 'organization').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Conversations
              {totalUnreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {totalUnreadCount}
                </Badge>
              )}
              {isLoadingMessages && (
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              )}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredConversations.map((conversation, index) => (
                <div
                  key={index}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                    selectedConversation === conversation ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    markConversationAsRead(conversation);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conversation.participant_name}</p>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.last_message_time).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredConversations.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Aucune conversation trouvée
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedConversation.participant_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col h-[500px]">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {selectedConversation.messages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_type === "organization" ? "justify-end" : "justify-start"
                        }`}
                        onClick={() => !message.read && markAsRead(message.id)}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender_type === "organization"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{message.sender_name}</span>
                            {message.read && message.sender_type !== "organization" && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                          </div>
                          <p className="text-sm">{message.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="icon">
                    <PaperclipIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Tapez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une conversation pour commencer</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
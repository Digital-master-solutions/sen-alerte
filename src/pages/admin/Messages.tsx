import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
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

export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [newConversationData, setNewConversationData] = useState({
    recipient_type: "organization",
    recipient_id: "",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("messagerie")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      
      data?.forEach((msg: Message) => {
        const key = `${msg.recipient_type}-${msg.recipient_id}`;
        
        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            participant_name: msg.recipient_name || "Participant inconnu",
            participant_type: msg.recipient_type,
            participant_id: msg.recipient_id,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: msg.read ? 0 : 1,
            messages: [],
          });
        }
        
        const conversation = conversationMap.get(key)!;
        conversation.messages.push(msg);
        
        if (!msg.read) {
          conversation.unread_count++;
        }
        
        if (new Date(msg.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = msg.message;
          conversation.last_message_time = msg.created_at;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from("messagerie")
        .insert({
          title: "Réponse",
          message: newMessage,
          sender_name: "Admin",
          sender_type: "admin",
          sender_id: "current-admin-id", // Should be actual admin ID
          recipient_name: selectedConversation.participant_name,
          recipient_type: selectedConversation.participant_type,
          recipient_id: selectedConversation.participant_id,
          is_reply: true,
        });

      if (error) throw error;

      setNewMessage("");
      loadConversations();
      toast({
        title: "Message envoyé",
        description: "Votre message a été envoyé avec succès",
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const startNewConversation = async () => {
    try {
      const { error } = await supabase
        .from("messagerie")
        .insert({
          title: newConversationData.title,
          message: newConversationData.message,
          sender_name: "Admin",
          sender_type: "admin",
          sender_id: "current-admin-id",
          recipient_type: newConversationData.recipient_type,
          recipient_id: newConversationData.recipient_id,
          recipient_name: "Destinataire",
        });

      if (error) throw error;

      setNewConversationOpen(false);
      setNewConversationData({
        recipient_type: "organization",
        recipient_id: "",
        title: "",
        message: "",
      });
      loadConversations();
      toast({
        title: "Conversation créée",
        description: "La nouvelle conversation a été créée avec succès",
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("messagerie")
        .update({ read: true })
        .eq("id", messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
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
            Communication avec les organisations et utilisateurs
          </p>
        </div>
        <Button onClick={() => setNewConversationOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle conversation
        </Button>
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
            <div className="text-2xl font-bold text-red-600">
              {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(conversations.map(c => c.participant_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              {newConversationOpen && (
                <Button variant="outline" size="sm" onClick={() => setNewConversationOpen(false)}>
                  Annuler
                </Button>
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
            {newConversationOpen ? (
              <div className="p-4 space-y-4">
                <Select 
                  value={newConversationData.recipient_type}
                  onValueChange={(value) => setNewConversationData({...newConversationData, recipient_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de destinataire" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organisation</SelectItem>
                    <SelectItem value="all_organizations">Toutes les organisations</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="ID du destinataire"
                  value={newConversationData.recipient_id}
                  onChange={(e) => setNewConversationData({...newConversationData, recipient_id: e.target.value})}
                />
                
                <Input
                  placeholder="Sujet"
                  value={newConversationData.title}
                  onChange={(e) => setNewConversationData({...newConversationData, title: e.target.value})}
                />
                
                <Textarea
                  placeholder="Message..."
                  value={newConversationData.message}
                  onChange={(e) => setNewConversationData({...newConversationData, message: e.target.value})}
                />
                
                <Button onClick={startNewConversation} className="w-full">
                  Envoyer
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                {filteredConversations.map((conversation, index) => (
                  <div
                    key={index}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                      selectedConversation === conversation ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {conversation.participant_type === "organization" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conversation.participant_name}</p>
                          {conversation.unread_count > 0 && (
                            <Badge variant="destructive" className="text-xs">
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
            )}
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedConversation.participant_type === "organization" ? (
                    <Building2 className="h-5 w-5" />
                  ) : (
                    <Users className="h-5 w-5" />
                  )}
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
                          message.sender_type === "admin" ? "justify-end" : "justify-start"
                        }`}
                        onClick={() => !message.read && markAsRead(message.id)}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender_type === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{message.sender_name}</span>
                            {message.read && message.sender_type !== "admin" && (
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
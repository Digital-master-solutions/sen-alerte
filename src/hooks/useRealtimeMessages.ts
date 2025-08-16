import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useRealtimeMessages = (userType: 'admin' | 'organization', userId?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("messagerie")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();
      
      data?.forEach((msg: Message) => {
        let key: string;
        let participantName: string;
        let participantType: string;
        let participantId: string;

        if (userType === 'admin') {
          // Pour l'admin, grouper par organisation
          if (msg.sender_type === 'organization') {
            key = `${msg.sender_type}-${msg.sender_id}`;
            participantName = msg.sender_name;
            participantType = msg.sender_type;
            participantId = msg.sender_id;
          } else {
            key = `${msg.recipient_type}-${msg.recipient_id}`;
            participantName = msg.recipient_name;
            participantType = msg.recipient_type;
            participantId = msg.recipient_id;
          }
        } else {
          // Pour l'organisation, toujours avec l'admin
          key = "super_admin-admin";
          participantName = "Administration";
          participantType = "super_admin";
          participantId = "admin";
        }

        if (!conversationMap.has(key)) {
          conversationMap.set(key, {
            participant_name: participantName || "Participant inconnu",
            participant_type: participantType,
            participant_id: participantId,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: 0,
            messages: [],
          });
        }
        
        const conversation = conversationMap.get(key)!;
        conversation.messages.push(msg);
        
        // Compter les messages non lus selon le type d'utilisateur
        if (!msg.read) {
          if (userType === 'admin' && msg.sender_type !== 'super_admin') {
            conversation.unread_count++;
          } else if (userType === 'organization' && msg.sender_type === 'super_admin') {
            conversation.unread_count++;
          }
        }
        
        // Mettre à jour le dernier message
        if (new Date(msg.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = msg.message;
          conversation.last_message_time = msg.created_at;
        }
      });

      const list = Array.from(conversationMap.values());
      setConversations(list);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    console.log('Realtime update received:', payload);
    
    if (payload.eventType === 'INSERT') {
      // Nouveau message - recharger immédiatement
      loadConversations();
    } else if (payload.eventType === 'UPDATE') {
      // Message mis à jour (lu) - recharger
      loadConversations();
    }
  };

  useEffect(() => {
    loadConversations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`messages_${userType}_realtime`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messagerie'
        },
        handleRealtimeUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userType, userId]);

  const markConversationAsRead = async (conversation: Conversation) => {
    try {
      let messagesToMark: Message[] = [];
      
      if (userType === 'admin') {
        messagesToMark = conversation.messages.filter(
          m => !m.read && m.sender_type !== 'super_admin'
        );
      } else {
        messagesToMark = conversation.messages.filter(
          m => !m.read && m.sender_type === 'super_admin'
        );
      }
      
      if (messagesToMark.length === 0) return;

      const { error } = await supabase
        .from("messagerie")
        .update({ read: true })
        .in("id", messagesToMark.map(m => m.id));
      
      if (error) throw error;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };

  const sendMessage = async (
    message: string,
    conversation: Conversation | null,
    senderName: string,
    senderId: string
  ) => {
    if (!message.trim() || !conversation) return false;

    try {
      const { error } = await supabase
        .from("messagerie")
        .insert({
          title: userType === 'admin' ? "Réponse" : "Message de l'organisation",
          message,
          sender_name: senderName,
          sender_type: userType === 'admin' ? 'super_admin' : 'organization',
          sender_id: senderId,
          recipient_name: conversation.participant_name,
          recipient_type: conversation.participant_type,
          recipient_id: conversation.participant_id,
          is_reply: true,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  return {
    conversations,
    loading,
    loadConversations,
    markConversationAsRead,
    sendMessage
  };
};
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("messagerie")
        .select("*")
        .order("created_at", { ascending: false });

      if (userType === 'organization' && userId) {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const conversationMap = new Map<string, Conversation>();
      
      data?.forEach((msg: Message) => {
        let key: string;
        let participantName: string;
        let participantType: string;
        let participantId: string;

        if (userType === 'admin') {
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
          key = "admin_conversation";
          participantName = "Administration";
          participantType = "admin";
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
        
        if (!msg.read) {
          const isIncoming = userType === 'admin' 
            ? msg.sender_type === 'organization'
            : msg.sender_type === 'admin' || msg.sender_type === 'super_admin';
          
          if (isIncoming) {
            conversation.unread_count++;
          }
        }
        
        if (new Date(msg.created_at) > new Date(conversation.last_message_time)) {
          conversation.last_message = msg.message;
          conversation.last_message_time = msg.created_at;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [userType, userId]);

  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Realtime update received:', payload);
    
    if (payload.eventType === 'INSERT') {
      const newMessage = payload.new;
      
      // Check if message is relevant to current user
      const isRelevant = userType === 'admin' 
        ? newMessage.sender_type === 'organization' || newMessage.recipient_type === 'admin'
        : newMessage.sender_id === userId || newMessage.recipient_id === userId;
      
      if (isRelevant) {
        // Check if it's not the user's own message to avoid showing notification
        const isOwnMessage = newMessage.sender_id === userId;
        
        if (!isOwnMessage) {
          toast(`Nouveau message de ${newMessage.sender_name}`, {
            description: newMessage.message.substring(0, 100),
          });
        }
        
        loadConversations();
      }
    } else if (payload.eventType === 'UPDATE') {
      // Message mis à jour (lu) - recharger
      loadConversations();
    }
  }, [userType, userId, loadConversations]);

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
        // Admin marks messages from organizations as read
        messagesToMark = conversation.messages.filter(
          m => !m.read && m.sender_type === 'organization'
        );
      } else {
        // Organization marks messages from admin as read
        messagesToMark = conversation.messages.filter(
          m => !m.read && (m.sender_type === 'admin' || m.sender_type === 'super_admin')
        );
      }
      
      if (messagesToMark.length === 0) return;

      const { error } = await supabase
        .from("messagerie")
        .update({ read: true })
        .in("id", messagesToMark.map(m => m.id));
      
      if (error) throw error;
      
      // Update local state immediately
      setConversations(prev => prev.map(conv => {
        if (conv.participant_id === conversation.participant_id) {
          return {
            ...conv,
            unread_count: 0,
            messages: conv.messages.map(msg => 
              messagesToMark.some(m => m.id === msg.id) 
                ? { ...msg, read: true }
                : msg
            )
          };
        }
        return conv;
      }));
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
      // Fix recipient mapping for proper communication
      let recipientType = conversation.participant_type;
      let recipientId = conversation.participant_id;
      let recipientName = conversation.participant_name;

      // For organization sending to admin
      if (userType === 'organization' && conversation.participant_type === 'admin') {
        recipientType = 'admin';
        recipientId = 'admin';
        recipientName = 'Administration';
      }

      const { error } = await supabase
        .from("messagerie")
        .insert({
          title: userType === 'admin' ? "Réponse de l'administration" : "Message de l'organisation",
          message,
          sender_name: senderName,
          sender_type: userType === 'admin' ? 'admin' : 'organization',
          sender_id: senderId,
          recipient_name: recipientName,
          recipient_type: recipientType,
          recipient_id: recipientId,
          is_reply: true,
          read: false
        });

      if (error) throw error;
      
      // Don't reload conversations immediately - let realtime handle it
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
import { useState, useEffect, useRef } from 'react';
import { messages as messagesApi } from '../lib/surgeApi';
import { useAsyncQueryWithRefresh } from '../lib/useSupabaseQuery';
import { supabase } from '../lib/supabaseClient';
import { Message } from '../types';

export function useMessages(conversationId: string | null, myId: string | null) {
  const [refreshToken, setRefreshToken] = useState(0);

  const rawMessages = useAsyncQueryWithRefresh(
    messagesApi.getByConversation,
    conversationId ? { conversation_id: conversationId } : 'skip',
    refreshToken
  );

  const sendMutation = messagesApi.send;
  const markReadMutation = messagesApi.markRead;

  const loading = rawMessages === undefined;
  const messages: Message[] = (rawMessages ?? []).map((message: any) => ({
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    receiver_id: message.receiver_id,
    text: message.text || '',
    media_url: message.media_url,
    media_type: message.media_type,
    reply_to_id: message.reply_to_id,
    status: message.status || 'sent',
    created_date: message.created_date || new Date().toISOString(),
  }));

  // Live updates for this conversation via Supabase Realtime.
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'surge_messages', filter: `conversation_id=eq.${conversationId}` },
        () => setRefreshToken((t) => t + 1)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (!myId || !messages.length) return;
    messages.forEach((message) => {
      if (message.receiver_id === myId && message.status !== 'read') {
        markReadMutation({ id: message.id }).catch(() => {});
      }
    });
  }, [messages, myId, markReadMutation]);

  const sendMessage = async (
    receiverId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
  ) => {
    if (!conversationId || !myId || !receiverId) return;
    await sendMutation({
      conversation_id: conversationId,
      receiver_id: receiverId,
      text,
      media_url: mediaUrl,
      media_type: mediaType,
    });
    setRefreshToken((t) => t + 1);
  };

  return { messages, loading, sendMessage };
}

export function makeConversationId(id1: string, id2: string): string {
  return [id1, id2].sort().join('_');
}

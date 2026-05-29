import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Message } from '../types';
import { isBot, getBotReply, botReplyDelay } from '../lib/bots';

export function useMessages(conversationId: string | null, myId: string | null) {
  const [botTyping, setBotTyping] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reactive Convex query for messages
  const rawMessages = useQuery(
    api.surgeMessages.getByConversation,
    conversationId ? { conversation_id: conversationId } : "skip"
  );
  const sendMutation = useMutation(api.surgeMessages.send);
  const markReadMutation = useMutation(api.surgeMessages.markRead);

  const loading = rawMessages === undefined;

  // Map Convex messages to our Message type
  const messages: Message[] = (rawMessages ?? []).map((m: any) => ({
    id: m._id,
    conversation_id: m.conversation_id,
    sender_id: m.sender_id,
    receiver_id: m.receiver_id,
    text: m.text || '',
    media_url: m.media_url,
    media_type: m.media_type,
    reply_to_id: m.reply_to_id,
    status: m.status || 'sent',
    created_date: m.created_date || new Date(m._creationTime).toISOString(),
  }));

  // Mark messages as read
  useEffect(() => {
    if (!myId || !messages.length) return;
    messages.forEach(m => {
      if (m.receiver_id === myId && m.status !== 'read') {
        markReadMutation({ message_id: m.id as any }).catch(() => {});
      }
    });
  }, [messages.length, myId]);

  // Bot reply scheduling
  const scheduleBotReply = useCallback((botId: string, userMessage: string) => {
    if (!conversationId || !myId) return;

    const delay = botReplyDelay();
    const typingStart = Math.max(0, delay - 3000);

    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => setBotTyping(true), typingStart);

    botTimerRef.current = setTimeout(async () => {
      setBotTyping(false);
      const replyText = getBotReply(userMessage);

      await sendMutation({
        conversation_id: conversationId,
        sender_id: botId,
        receiver_id: myId,
        text: replyText,
      });
    }, delay);
  }, [conversationId, myId, sendMutation]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const sendMessage = async (
    receiverId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video',
  ) => {
    if (!conversationId || !myId || !receiverId) return;

    await sendMutation({
      conversation_id: conversationId,
      sender_id: myId,
      receiver_id: receiverId,
      text,
      media_url: mediaUrl,
      media_type: mediaType,
    });

    if (isBot(receiverId)) {
      scheduleBotReply(receiverId, text);
    }
  };

  return { messages, loading, sendMessage, botTyping };
}

export function makeConversationId(id1: string, id2: string): string {
  return [id1, id2].sort().join('_');
}

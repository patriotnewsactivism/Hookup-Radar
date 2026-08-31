import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Message } from '../types';
import { isBot, getBotReply, botReplyDelay } from '../lib/bots';

export function useMessages(conversationId: string | null, myId: string | null) {
  const [botTyping, setBotTyping] = useState(false);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawMessages = useQuery(
    api.surgeMessages.getByConversation,
    conversationId ? { conversation_id: conversationId } : 'skip'
  );
  const sendMutation = useMutation(api.surgeMessages.send);
  const sendBotReplyMutation = useMutation(api.surgeMessages.sendBotReply);
  const markReadMutation = useMutation(api.surgeMessages.markRead);

  const loading = rawMessages === undefined;
  const messages: Message[] = (rawMessages ?? []).map((message: any) => ({
    id: message._id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    receiver_id: message.receiver_id,
    text: message.text || '',
    media_url: message.media_url,
    media_type: message.media_type,
    reply_to_id: message.reply_to_id,
    status: message.status || 'sent',
    created_date: message.created_date || new Date(message._creationTime).toISOString(),
  }));

  useEffect(() => {
    if (!myId || !messages.length) return;
    messages.forEach((message) => {
      if (message.receiver_id === myId && message.status !== 'read') {
        markReadMutation({ id: message.id as any }).catch(() => {});
      }
    });
  }, [messages, myId, markReadMutation]);

  const scheduleBotReply = useCallback((botId: string, userMessage: string) => {
    if (!conversationId || !myId) return;
    const delay = botReplyDelay();
    const typingStart = Math.max(0, delay - 3000);

    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setBotTyping(true), typingStart);

    botTimerRef.current = setTimeout(async () => {
      setBotTyping(false);
      await sendBotReplyMutation({
        conversation_id: conversationId,
        bot_id: botId,
        receiver_id: myId,
        text: getBotReply(userMessage),
      });
    }, delay);
  }, [conversationId, myId, sendBotReplyMutation]);

  useEffect(() => () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
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
    if (isBot(receiverId)) scheduleBotReply(receiverId, text);
  };

  return { messages, loading, sendMessage, botTyping };
}

export function makeConversationId(id1: string, id2: string): string {
  return [id1, id2].sort().join('_');
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SurgeUser } from '../types';
import { Avatar } from '../components/ui/SurgeAvatar';
import { formatDistanceToNow } from 'date-fns';
import { ChatPage } from './ChatPage';
import { MessageCircle } from 'lucide-react';
import { getBotProfileById, BOT_IDS_PREFIX } from '../lib/bots';

interface ConvoSummary {
  other_user: SurgeUser;
  last_message: any;
  unread_count: number;
  conversation_id: string;
}

export function ChatListPage() {
  const { profile } = useAuth();
  const [activeConvo, setActiveConvo] = useState<ConvoSummary | null>(null);

  // Reactive Convex query for conversations
  const conversations = useQuery(
    api.surgeMessages.getConversations,
    profile?.id ? { user_id: profile.id } : "skip"
  );

  const loading = conversations === undefined;

  // Build conversation summaries
  const convos: ConvoSummary[] = (conversations ?? [])
    .map((c: any) => {
      // Try to get bot profile if it's a bot
      let otherUser: SurgeUser | null = null;
      if (c.other_user_id.startsWith(BOT_IDS_PREFIX)) {
        const bot = getBotProfileById(c.other_user_id);
        if (bot) otherUser = bot as SurgeUser;
      }

      // If not a bot, create a minimal user object
      if (!otherUser) {
        otherUser = {
          id: c.other_user_id,
          display_name: c.other_user_id.slice(0, 8),
          username: c.other_user_id.slice(0, 8),
          is_online: false,
          is_anonymous: false,
          photo_url: '',
        } as SurgeUser;
      }

      // Skip blocked users
      if (profile?.blocked_users?.includes(c.other_user_id)) return null;

      return {
        other_user: otherUser,
        last_message: c.last_message,
        unread_count: c.unread_count,
        conversation_id: c.id,
      };
    })
    .filter(Boolean) as ConvoSummary[];

  // Sort by last message date
  convos.sort((a, b) => {
    const at = a.last_message?.created_date ? new Date(a.last_message.created_date).getTime() : 0;
    const bt = b.last_message?.created_date ? new Date(b.last_message.created_date).getTime() : 0;
    return bt - at;
  });

  if (activeConvo) {
    return (
      <ChatPage
        otherUser={activeConvo.other_user}
        conversationId={activeConvo.conversation_id}
        onBack={() => setActiveConvo(null)}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="sticky top-0 bg-black/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-white/5">
        <h1 className="text-white font-black text-xl">Messages</h1>
        {convos.some(c => c.unread_count > 0) && (
          <p className="text-purple-400 text-xs">{convos.reduce((a, c) => a + c.unread_count, 0)} unread</p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : convos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <MessageCircle size={48} className="text-gray-700 mb-4" />
          <p className="text-white font-bold text-lg mb-2">No chats yet</p>
          <p className="text-gray-500 text-sm">Find someone nearby and start a conversation</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {convos.map(convo => (
            <button
              key={convo.conversation_id}
              onClick={() => setActiveConvo(convo)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
            >
              <div className="relative">
                <Avatar user={convo.other_user} size="md" />
                {convo.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {convo.unread_count > 9 ? '9+' : convo.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className={`font-semibold text-sm ${convo.unread_count > 0 ? 'text-white' : 'text-gray-300'}`}>
                    {convo.other_user.is_anonymous ? '🥷 Anonymous' : convo.other_user.display_name || convo.other_user.username}
                  </span>
                  {convo.last_message?.created_date && (
                    <span className="text-gray-600 text-xs flex-shrink-0">
                      {formatDistanceToNow(new Date(convo.last_message.created_date), { addSuffix: false })}
                    </span>
                  )}
                </div>
                <p className={`text-sm truncate ${convo.unread_count > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                  {convo.last_message?.sender_id === profile?.id ? '↑ ' : ''}
                  {convo.last_message?.media_url ? '📷 Photo' : (convo.last_message?.text || '…')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

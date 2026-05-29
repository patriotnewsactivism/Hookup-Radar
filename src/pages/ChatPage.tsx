import React, { useState, useRef, useEffect } from 'react';
import { SurgeUser } from '../types';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/SurgeAvatar';
import { ArrowLeft, Send, Smile, MoreVertical, Flag, Ban, Paperclip, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { IcebreakerPrompt } from '../components/IcebreakerPrompt';
import { useMediaUpload } from '../hooks/useMediaUpload';
import clsx from 'clsx';

interface Props {
  otherUser: SurgeUser;
  conversationId: string;
  onBack: () => void;
}

const EMOJI_QUICK = ['😍', '🔥', '👋', '😈', '💦', '❤️', '👅', '🙈', '😏', '💪'];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="flex-shrink-0">
        <div className="w-6 h-6 rounded-full bg-gray-700" />
      </div>
      <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export function ChatPage({ otherUser, conversationId, onBack }: Props) {
  const { profile, updateProfile } = useAuth();
  const { messages, sendMessage, botTyping } = useMessages(conversationId, profile?.id ?? null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const { upload: uploadMedia, uploading: mediaUploading, progress: mediaProgress } = useMediaUpload();
  const sendMediaMessage = useMutation(api.surgeMedia.sendMediaMessage);
  const createReport = useMutation(api.surgeReports.create);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, botTyping]);

  const hasMessages = messages.length > 0;
  const handleIcebreaker = (t: string) => setText(t);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setSending(true);
    try {
      await sendMessage(otherUser.id, trimmed);
    } catch {
      toast.error('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleMediaSend = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    try {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) { toast.error('Only photos and videos allowed'); return; }
      const result = await uploadMedia(file, profile.id, { isProfilePhoto: false });
      if (result) {
        // Use the storage-based media message
        await sendMediaMessage({
          conversation_id: conversationId,
          sender_id: profile.id,
          receiver_id: otherUser.id,
          storage_id: result.mediaId as any,
          media_type: isImage ? 'image' : 'video',
        });
        toast.success(`${isImage ? 'Photo' : 'Video'} sent!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send media');
    }
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleBlock = async () => {
    if (!profile?.id) return;
    const newBlocked = [...(profile.blocked_users || []), otherUser.id];
    await updateProfile({ blocked_users: newBlocked });
    toast.success('User blocked');
    onBack();
  };

  const handleReport = async () => {
    if (!profile?.id) return;
    await createReport({
      reporter_id: profile.id,
      reported_id: otherUser.id,
      reason: 'Reported from chat',
    });
    toast.success('Reported. Thank you.');
    setShowMenu(false);
  };

  const myId = profile?.id;

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gray-950/80 backdrop-blur-md flex-shrink-0">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <Avatar user={otherUser} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">
            {otherUser.is_anonymous ? '🥷 Anonymous' : otherUser.display_name || otherUser.username}
          </p>
          <p className="text-xs text-gray-500">
            {botTyping
              ? <span className="text-purple-400 animate-pulse">typing…</span>
              : otherUser.is_online
                ? '🟢 Online'
                : `Last seen ${formatDistanceToNow(new Date(otherUser.last_seen || Date.now()), { addSuffix: true })}`
            }
          </p>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(p => !p)} className="text-gray-400 hover:text-white p-1">
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 w-40">
              <button onClick={handleReport} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-400 hover:bg-white/5">
                <Flag size={14} /> Report
              </button>
              <button onClick={handleBlock} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-white/5">
                <Ban size={14} /> Block
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <IcebreakerPrompt them={otherUser} onSelect={handleIcebreaker} />
        )}
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === myId;
          const showAvatar = !isMe && (i === 0 || messages[i - 1]?.sender_id !== msg.sender_id);
          return (
            <div key={msg.id} className={clsx('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}>
              {!isMe && (
                <div className={clsx('flex-shrink-0', showAvatar ? 'opacity-100' : 'opacity-0')}>
                  <Avatar user={otherUser} size="xs" showOnline={false} />
                </div>
              )}
              <div className={clsx('max-w-[70%] space-y-1', isMe && 'items-end flex flex-col')}>
                {msg.media_url ? (
                  msg.media_type === 'video' ? (
                    <video src={msg.media_url} controls className="rounded-2xl max-w-full max-h-60 object-cover" />
                  ) : (
                    <img src={msg.media_url} alt="media" className="rounded-2xl max-w-full max-h-60 object-cover cursor-pointer" onClick={() => window.open(msg.media_url, '_blank')} />
                  )
                ) : null}
                {msg.text && (
                  <div className={clsx(
                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  )}>
                    {msg.text}
                  </div>
                )}
                <div className={clsx('text-xs text-gray-600 flex items-center gap-1', isMe ? 'justify-end' : 'justify-start')}>
                  {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                  {isMe && <span>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {botTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Emoji quick bar */}
      {showEmoji && (
        <div className="flex gap-2 px-4 py-2 border-t border-white/5 overflow-x-auto">
          {EMOJI_QUICK.map(e => (
            <button key={e} onClick={() => setText(t => t + e)} className="text-2xl hover:scale-125 transition-transform flex-shrink-0">
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      {/* Hidden file input for media */}
      <input ref={mediaInputRef} type="file" accept="image/*,video/*" onChange={handleMediaSend} className="hidden" />

      {/* Media upload progress */}
      {mediaUploading && (
        <div className="px-4 py-2 bg-purple-900/30 border-t border-purple-700/30 flex items-center gap-2 text-sm text-purple-300">
          <Loader2 size={14} className="animate-spin" />
          Uploading... {mediaProgress}%
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 flex-shrink-0 bg-gray-950/80 backdrop-blur-md">
        <button
          onClick={() => mediaInputRef.current?.click()}
          disabled={mediaUploading}
          className="text-gray-500 hover:text-purple-400 transition-colors disabled:opacity-40"
        >
          <Paperclip size={22} />
        </button>
        <button onClick={() => setShowEmoji(p => !p)} className={clsx('text-gray-500 hover:text-purple-400 transition-colors', showEmoji && 'text-purple-400')}>
          <Smile size={22} />
        </button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Say something…"
          className="flex-1 bg-gray-900 border border-white/10 text-white placeholder-gray-600 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
        >
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

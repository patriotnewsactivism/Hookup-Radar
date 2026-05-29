import React, { useState } from 'react';
import { SurgeUser } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Avatar } from './ui/SurgeAvatar';
import { Badge } from './ui/SurgeBadge';
import { ReliabilityBadge } from './ReliabilityBadge';
import { RateHookup } from './RateHookup';
import { FakeProfileReporter } from './FakeProfileReporter';
import { X, MessageCircle, Flag, Ban, MapPin, Star, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { makeConversationId } from '../hooks/useMessages';
import clsx from 'clsx';

interface Props {
  user: SurgeUser;
  onClose: () => void;
  onChat?: (conversationId: string) => void;
}

export function UserProfileModal({ user, onClose, onChat }: Props) {
  const { profile, updateProfile } = useAuth();
  const [showRate, setShowRate] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const createReport = useMutation(api.surgeReports.create);
  const incrementViews = useMutation(api.surgeUsers.incrementViews);

  // Increment view count
  React.useEffect(() => {
    if (user.id && !user.id.startsWith('bot_')) {
      incrementViews({ id: user.id as any }).catch(() => {});
    }
  }, [user.id]);

  const handleChat = () => {
    if (!profile?.id) return;
    const convId = makeConversationId(profile.id, user.id);
    onChat?.(convId);
    onClose();
  };

  const handleBlock = async () => {
    if (!profile?.id) return;
    const newBlocked = [...(profile.blocked_users || []), user.id];
    await updateProfile({ blocked_users: newBlocked });
    toast.success('User blocked');
    onClose();
  };

  const handleReport = async () => {
    if (!profile?.id) return;
    await createReport({
      reporter_id: profile.id,
      reported_id: user.id,
      reason: 'Reported from profile modal',
    });
    toast.success('Reported. Thank you.');
  };

  const distanceText = user.distance != null
    ? user.distance < 5280
      ? `${user.distance} ft away`
      : `${(user.distance / 5280).toFixed(1)} mi away`
    : null;

  const isAnon = user.is_anonymous;
  const isRightNow = user.looking_for?.includes('Right Now');

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-950 border border-white/10 rounded-3xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative">
          {user.photo_url && !isAnon ? (
            <img src={user.photo_url} alt="" className="w-full aspect-square object-cover rounded-t-3xl" />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-purple-900 to-pink-900 rounded-t-3xl flex items-center justify-center">
              <span className="text-6xl font-black text-white/30">{(user.display_name || '?')[0]}</span>
            </div>
          )}
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-full p-2">
            <X size={18} className="text-white" />
          </button>
          {isRightNow && (
            <div className="absolute bottom-3 left-3 bg-red-600 px-3 py-1 rounded-full text-white text-xs font-bold animate-pulse">
              🔥 Right Now
            </div>
          )}
          {user.is_online && (
            <div className="absolute bottom-3 right-3 bg-green-600 px-3 py-1 rounded-full text-white text-xs font-bold">
              Online
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 className="text-white font-black text-xl">
              {isAnon ? '🥷 Anonymous' : (user.display_name || user.username)}
            </h2>
            <p className="text-gray-400 text-sm">
              {user.age} · {user.gender} · {user.orientation}
              {user.position && ` · ${user.position}`}
            </p>
            {distanceText && (
              <p className="text-purple-400 text-xs mt-1 flex items-center gap-1">
                <MapPin size={12} /> {distanceText}
              </p>
            )}
          </div>

          {user.bio && <p className="text-gray-300 text-sm leading-relaxed">{user.bio}</p>}

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Body', value: user.body_type },
              { label: 'Height', value: user.height || '—' },
              { label: 'Health', value: user.health_status || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900 rounded-xl p-2.5 text-center">
                <p className="text-gray-600 text-xs">{label}</p>
                <p className="text-white text-xs font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {user.looking_for?.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs uppercase mb-1.5">Looking For</p>
              <div className="flex flex-wrap gap-1.5">
                {user.looking_for.map(lf => <Badge key={lf} label={lf} variant="purple" />)}
              </div>
            </div>
          )}

          <ReliabilityBadge userId={user.id} />

          <div className="flex gap-2">
            <button onClick={handleChat} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <MessageCircle size={18} /> Message
            </button>
            <button onClick={() => setShowRate(true)} className="bg-gray-900 border border-white/10 text-yellow-400 p-3 rounded-2xl hover:bg-white/5 transition-colors">
              <Star size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <button onClick={handleReport} className="flex-1 text-center text-orange-400 text-xs py-2 hover:text-orange-300">
              <Flag size={12} className="inline mr-1" /> Report
            </button>
            <button onClick={handleBlock} className="flex-1 text-center text-red-400 text-xs py-2 hover:text-red-300">
              <Ban size={12} className="inline mr-1" /> Block
            </button>
          </div>
        </div>

        {showRate && profile && (
          <RateHookup userId={user.id} raterId={profile.id} onClose={() => setShowRate(false)} />
        )}
        {showReport && profile && (
          <FakeProfileReporter user={user} reporterId={profile.id} onClose={() => setShowReport(false)} />
        )}
      </div>
    </div>
  );
}

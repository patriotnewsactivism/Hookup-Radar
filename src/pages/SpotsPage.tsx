import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, MessageCircle, Plus, X, Send, Calendar,
  Flame, ChevronRight, Loader2,
  TreePine, Waves, Beer, Building2, BookOpen, DoorOpen, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

type SpotCategory = 'park' | 'beach' | 'bar' | 'sauna' | 'bookstore' | 'restroom' | 'other';
type EventType = 'gangbang' | 'orgy' | 'gloryhole' | 'cumdump' | 'group_play' | 'bear_party' | 'leather_night' | 'jo_party' | 'watersports' | 'bdsm_session' | 'open_house';

const CATEGORY_META: Record<SpotCategory, { label: string; icon: React.FC<any>; color: string }> = {
  park:      { label: 'Park',         icon: TreePine,   color: 'text-green-400' },
  beach:     { label: 'Beach',        icon: Waves,      color: 'text-blue-400' },
  bar:       { label: 'Bar / Club',   icon: Beer,       color: 'text-yellow-400' },
  sauna:     { label: 'Sauna / Spa',  icon: Building2,  color: 'text-orange-400' },
  bookstore: { label: 'Adult Store',  icon: BookOpen,   color: 'text-pink-400' },
  restroom:  { label: 'Restroom',     icon: DoorOpen,   color: 'text-purple-400' },
  other:     { label: 'Other',        icon: HelpCircle, color: 'text-gray-400' },
};

const EVENT_LABELS: Record<EventType, string> = {
  gangbang: '🍆 Gangbang', orgy: '🔥 Orgy', gloryhole: '🕳️ Gloryhole',
  cumdump: '💦 Cumdump', group_play: '👥 Group Play', bear_party: '🐻 Bear Party',
  leather_night: '🖤 Leather Night', jo_party: '✊ JO Party',
  watersports: '🚿 Watersports', bdsm_session: '⛓️ BDSM Session', open_house: '🚪 Open House',
};

export function SpotsPage() {
  const { profile } = useAuth();
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<SpotCategory | 'all'>('all');

  const spots = useQuery(api.surgeSpots.listApproved);
  const createSpot = useMutation(api.surgeSpots.create);

  const loading = spots === undefined;
  const filtered = (spots ?? []).filter(s => filter === 'all' || s.category === filter);

  if (selectedSpotId) {
    const spot = (spots ?? []).find(s => s._id === selectedSpotId);
    if (spot) {
      return <SpotDetail spot={spot} onBack={() => setSelectedSpotId(null)} />;
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 backdrop-blur-md px-4 pt-4 pb-3 border-b border-white/5 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-white font-black text-xl flex items-center gap-2">
            <Flame size={20} className="text-orange-400" /> Spots
          </h1>
          <button onClick={() => setShowCreate(true)} className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <Plus size={14} /> Add Spot
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${filter === 'all' ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>All</button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button key={key} onClick={() => setFilter(key as SpotCategory)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${filter === key ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>
                <Icon size={12} /> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spots list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="text-purple-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <MapPin size={48} className="text-gray-700 mb-4" />
          <p className="text-white font-bold text-lg mb-2">No spots found</p>
          <p className="text-gray-500 text-sm">Be the first to add a spot in your area</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {filtered.map(spot => {
            const meta = CATEGORY_META[spot.category as SpotCategory] || CATEGORY_META.other;
            const Icon = meta.icon;
            return (
              <button key={spot._id} onClick={() => setSelectedSpotId(spot._id)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left">
                <div className={`w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0`}>
                  <Icon size={20} className={meta.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{spot.name}</p>
                  <p className="text-gray-500 text-xs truncate">{spot.address}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-600 flex-shrink-0">
                  <Users size={14} /> <span className="text-xs">{spot.active_users || 0}</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Create spot modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateSpotModal onClose={() => setShowCreate(false)} onCreate={async (data) => {
            try {
              await createSpot({
                name: data.name,
                description: data.description,
                category: data.category,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                submitted_by: profile?.id || '',
              });
              toast.success('Spot submitted!');
              setShowCreate(false);
            } catch { toast.error('Failed to create spot'); }
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SpotDetail({ spot, onBack }: { spot: any; onBack: () => void }) {
  const { profile } = useAuth();
  const [msgText, setMsgText] = useState('');

  const events = useQuery(api.surgeSpots.getEvents, { spot_id: spot._id });
  const messages = useQuery(api.surgeSpots.getSpotMessages, { spot_id: spot._id });
  const sendMsg = useMutation(api.surgeSpots.sendSpotMessage);
  const rsvp = useMutation(api.surgeSpots.rsvp);

  const meta = CATEGORY_META[spot.category as SpotCategory] || CATEGORY_META.other;
  const Icon = meta.icon;

  const handleSendMsg = async () => {
    const t = msgText.trim();
    if (!t || !profile?.id) return;
    setMsgText('');
    await sendMsg({ spot_id: spot._id, user_id: profile.id, text: t });
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-white"><X size={20} /></button>
        <div className={`w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center`}>
          <Icon size={16} className={meta.color} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm truncate">{spot.name}</h2>
          <p className="text-gray-500 text-xs truncate">{spot.address}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {spot.description && <p className="text-gray-300 text-sm">{spot.description}</p>}

        {/* Events */}
        {events && events.length > 0 && (
          <div>
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2"><Calendar size={14} /> Events</h3>
            <div className="space-y-2">
              {events.map((ev: any) => (
                <div key={ev._id} className="bg-gray-900 rounded-2xl p-3 border border-white/5">
                  <p className="text-white font-semibold text-sm">{EVENT_LABELS[ev.event_type as EventType] || ev.event_type} — {ev.title}</p>
                  <p className="text-gray-500 text-xs mt-1">{new Date(ev.starts_at).toLocaleString()}</p>
                  {ev.description && <p className="text-gray-400 text-xs mt-1">{ev.description}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-gray-500 text-xs"><Users size={12} className="inline" /> {ev.attendee_count || 0}{ev.max_attendees ? `/${ev.max_attendees}` : ''}</span>
                    <button onClick={() => profile?.id && rsvp({ event_id: ev._id, user_id: profile.id })} className="text-xs bg-purple-700 text-white px-2 py-1 rounded-lg font-semibold">
                      RSVP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div>
          <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2"><MessageCircle size={14} /> Chat</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(messages ?? []).map((msg: any) => (
              <div key={msg._id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-800 flex-shrink-0" />
                <div>
                  <p className="text-white text-xs font-semibold">{msg.user_id.slice(0, 8)}</p>
                  <p className="text-gray-300 text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            {(messages ?? []).length === 0 && <p className="text-gray-600 text-xs">No messages yet</p>}
          </div>
        </div>
      </div>

      {/* Message input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
        <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMsg()} placeholder="Say something…" className="flex-1 bg-gray-900 border border-white/10 text-white placeholder-gray-600 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
        <button onClick={handleSendMsg} disabled={!msgText.trim()} className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center disabled:opacity-40">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

function CreateSpotModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SpotCategory>('park');
  const [address, setAddress] = useState('');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center pb-6 px-4">
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Add a Spot</h3>
          <button onClick={onClose} className="text-gray-500"><X size={18} /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Spot name" className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address or location" className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500" />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORY_META) as SpotCategory[]).map(k => (
            <button key={k} onClick={() => setCategory(k)} className={`px-3 py-1.5 rounded-xl text-xs border ${category === k ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-800 border-white/10 text-gray-400'}`}>
              {CATEGORY_META[k].label}
            </button>
          ))}
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-purple-500" />
        <button onClick={() => onCreate({ name, description, category, address, lat: 0, lng: 0 })} disabled={!name.trim()} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-2xl disabled:opacity-40">
          Submit Spot
        </button>
      </motion.div>
    </motion.div>
  );
}

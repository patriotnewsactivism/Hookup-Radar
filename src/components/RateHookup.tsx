import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import { Star, X } from 'lucide-react';

interface Props {
  userId: string;
  raterId: string;
  onClose: () => void;
}

const TAGS = ['showed_up', 'respectful', 'good_vibes', 'safe', 'generous', 'fun', 'ghosted', 'creepy', 'pushy'];

export function RateHookup({ userId, raterId, onClose }: Props) {
  const [reliability, setReliability] = useState(3);
  const [vibe, setVibe] = useState(3);
  const [meetup, setMeetup] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const upsertRating = useMutation(api.surgeRatings.upsert);

  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await upsertRating({
        rater_id: raterId,
        rated_user_id: userId,
        meetup_happened: meetup,
        reliability_score: reliability,
        vibe_score: vibe,
        tags,
        comment: comment || undefined,
      });
      toast.success('Rating submitted');
      onClose();
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center pb-6 px-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold">Rate This Person</h3>
          <button onClick={onClose} className="text-gray-500"><X size={18} /></button>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setMeetup(p => !p)} className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${meetup ? 'bg-green-600' : 'bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${meetup ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-white text-sm">We actually met up</span>
        </label>

        <div>
          <p className="text-gray-400 text-xs uppercase mb-2">Reliability ({reliability}/5)</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setReliability(n)} className={`p-1 ${n <= reliability ? 'text-yellow-400' : 'text-gray-700'}`}>
                <Star size={24} fill={n <= reliability ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase mb-2">Vibe ({vibe}/5)</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setVibe(n)} className={`p-1 ${n <= vibe ? 'text-pink-400' : 'text-gray-700'}`}>
                <Star size={24} fill={n <= vibe ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} className={`px-3 py-1.5 rounded-xl text-xs border ${tags.includes(t) ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-800 border-white/10 text-gray-400'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional comment" rows={2} className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none" />

        <button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-2xl disabled:opacity-40">
          {submitting ? 'Submitting…' : 'Submit Rating'}
        </button>
      </div>
    </div>
  );
}

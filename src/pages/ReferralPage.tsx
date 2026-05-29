import { useAuth } from '../contexts/AuthContext';
import { Gift, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralPage() {
  const { profile } = useAuth();
  if (!profile) return null;

  const refCode = `SURGE-${(profile.username || 'USER').toUpperCase().slice(0, 6)}`;
  const refLink = `${window.location.origin}?ref=${refCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink).then(() => toast.success('Link copied!'));
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Join me on Surge', text: 'Find people nearby on Surge ⚡', url: refLink });
    } else {
      copyLink();
    }
  };

  return (
    <div className="px-5 py-5 space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <Gift size={24} className="text-purple-400" />
        <div>
          <h2 className="text-white font-black text-xl">Invite Friends</h2>
          <p className="text-gray-500 text-sm">Share Surge with your crew</p>
        </div>
      </div>
      <div className="bg-gray-900 rounded-2xl p-4 border border-white/10 space-y-3">
        <p className="text-gray-400 text-xs uppercase tracking-wider">Your Referral Code</p>
        <p className="text-white font-mono text-lg font-bold">{refCode}</p>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 bg-purple-700 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition-colors">
            <Copy size={16} /> Copy Link
          </button>
          <button onClick={share} className="flex-1 flex items-center justify-center gap-2 bg-gray-800 border border-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/5 transition-colors">
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

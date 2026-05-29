/**
 * FakeProfileReporter — one-tap bot/fake report with reason selection.
 */
import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SurgeUser } from '../types';
import { toast } from 'sonner';
import { Flag, X, AlertTriangle } from 'lucide-react';

const REASONS = [
  'Fake photos',
  'Bot / spam',
  'Catfishing',
  'Underage',
  'Impersonation',
  'Other',
];

interface Props {
  user: SurgeUser;
  reporterId: string;
  onClose: () => void;
}

export function FakeProfileReporter({ user, reporterId, onClose }: Props) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const createReport = useMutation(api.surgeReports.create);

  const handleSubmit = async () => {
    if (!reason) { toast.error('Select a reason'); return; }
    setSubmitting(true);
    try {
      await createReport({
        reporter_id: reporterId,
        reported_id: user.id,
        reason: `fake_profile: ${reason}`,
        details: details || undefined,
      });
      toast.success('Report submitted — thank you');
      onClose();
    } catch {
      toast.error('Report failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center pb-6 px-4">
      <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2"><AlertTriangle size={18} className="text-orange-400" /> Report Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={18} /></button>
        </div>
        <p className="text-gray-400 text-sm">Why do you think <strong className="text-white">{user.display_name || user.username}</strong> is fake?</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)} className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${reason === r ? 'bg-orange-700 border-orange-500 text-white' : 'bg-gray-800 border-white/10 text-gray-400'}`}>{r}</button>
          ))}
        </div>
        <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Any extra info (optional)" rows={2} className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-orange-500" />
        <button onClick={handleSubmit} disabled={submitting || !reason} className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors">
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </div>
    </div>
  );
}

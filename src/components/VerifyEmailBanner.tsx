// Non-blocking banner for signed-in users whose email isn't confirmed yet.
// Instant access is kept — this only nudges verification (reward handled by
// the reward ledger once the referral economy ships).
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { MailCheck, RefreshCw, X } from 'lucide-react';

export function VerifyEmailBanner() {
  const { authUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (dismissed) return null;
  if (!authUser || authUser.emailConfirmed !== false) return null;

  const resend = async () => {
    if (!authUser.email) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: authUser.email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success('Verification email sent — check your inbox');
    } catch (e: any) {
      toast.error(e.message || 'Could not resend verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-strong)] bg-[var(--bg-muted)]">
      <MailCheck size={18} className="text-[var(--accent)] flex-shrink-0" />
      <p className="text-xs text-[var(--text-secondary)] flex-1 leading-snug">
        <span className="font-semibold text-[var(--text-primary)]">Verify your email → +1 free Premium day.</span>{' '}
        Confirm the link we sent to{' '}
        <span className="text-[var(--accent)]">{authUser.email}</span>
      </p>
      <button
        onClick={resend}
        disabled={sending}
        className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#050c1a] disabled:opacity-50 flex items-center gap-1.5"
      >
        <RefreshCw size={12} className={sending ? 'animate-spin' : ''} /> Resend
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        title="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}
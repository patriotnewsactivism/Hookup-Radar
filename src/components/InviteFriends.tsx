// InviteFriends — the referral hub.
// Surfaces the user's referral code, share deep links (copy / SMS / WhatsApp /
// mailto), an email-invite form (edge function), and the live milestone
// ladder. Every server-confirmed action toasts the earned days.

import clsx from "clsx";
import {
  Check,
  Copy,
  Crown,
  Gift,
  Mail,
  MessageCircle,
  Share2,
  Sparkles,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { referrals } from "../lib/surgeApi";
import type { ReferralStatsResponse, RewardEvent } from "../types";

const SHARE_DEFAULT_TEXT =
  "Join me on SURGE — real people, real close. Use my code for 7 free Premium days ⚡";

export function InviteFriends() {
  const { profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState<ReferralStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const codeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await referrals.stats();
        if (active) setStats(result);
      } catch (e: any) {
        toast.error(e.message || "Could not load invite stats");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const afterInvite = (days: number) => {
    void refreshProfile();
    if (days > 0) toast.success(`+${days} day Premium ⚡ keep inviting!`);
    else toast.success("Invite shared");
    void loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const code = stats?.referral_code || profile?.referral_code || "••••";
  const { url } = referrals.buildShare({ code });
  const links = referrals.buildChannelLinks({ code, text: SHARE_DEFAULT_TEXT });

  const loadStats = async () => {
    try {
      const result = await referrals.stats();
      setStats(result);
    } catch {
      // banner-less silent refresh; next manual open re-syncs
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied — share it with a friend");
    } catch {
      toast.error("Could not copy");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      const res = await referrals.recordInviteSent("share");
      afterInvite(res?.days ?? 0);
    } catch (e: any) {
      toast.error(e.message || "Could not copy link");
    }
  };

  const recordChannel = async (channel: "sms" | "whatsapp" | "mailto") => {
    try {
      const res = await referrals.recordInviteSent(channel);
      afterInvite(res?.days ?? 0);
    } catch {
      // The deep link still opens; reward is best-effort.
    }
  };

  const openShareSheet = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on SURGE",
          text: SHARE_DEFAULT_TEXT,
          url,
        });
        const res = await referrals.recordInviteSent("share");
        afterInvite(res?.days ?? 0);
        return;
      } catch {
        // fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${SHARE_DEFAULT_TEXT} ${url}`);
      const res = await referrals.recordInviteSent("share");
      afterInvite(res?.days ?? 0);
    } catch {
      toast.error("Could not open the share sheet");
    }
  };

  const sendEmail = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email");
      return;
    }
    setBusy(true);
    try {
      const res = await referrals.sendEmailInvite({ email: trimmed, message });
      toast.success(
        `Invite sent${res.days ? ` — +${res.days} day Premium ⚡` : ""}`,
      );
      setEmail("");
      setMessage("");
      void loadStats();
      void refreshProfile();
    } catch (e: any) {
      toast.error(e.message || "Invite send failed");
    } finally {
      setBusy(false);
    }
  };

  const milestone = (key: string) =>
    (stats?.milestones || []).find(m => m.key === key);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Crown size={16} className="text-[var(--accent)]" />
        <h3 className="text-white font-bold text-sm">
          Invite Friends — Earn Premium
        </h3>
      </div>
      <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
        Every invite earns you free Premium days. Friends who join with your
        code get 7 free days too — and if they stick around 30 days, you get 30
        more plus the{" "}
        <span className="text-[var(--accent)] font-semibold">Rebel</span> badge.
      </p>

      {/* Code card */}
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-2xl p-4">
        <p className="text-[var(--text-muted)] text-xs uppercase tracking-wider mb-2">
          Your code
        </p>
        <div className="flex items-center gap-2">
          <span
            ref={codeRef}
            className="font-mono text-2xl font-black tracking-widest text-[var(--accent-bright)] select-all"
          >
            {code}
          </span>
          <button
            onClick={copyCode}
            className="p-2 rounded-xl bg-gray-900 border border-white/10 text-[var(--accent)] hover:border-[var(--border-strong)] transition-colors"
            title="Copy code"
          >
            <Copy size={16} />
          </button>
        </div>
        <p className="text-[var(--text-muted)] text-xs mt-1 break-all truncate">
          {url}
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={copyLink}
            className="flex-1 flex items-center justify-center gap-2 bg-[var(--accent)] text-[#050c1a] font-bold py-2.5 rounded-xl text-sm active:scale-95"
          >
            <Copy size={14} /> Copy link
          </button>
          <button
            onClick={openShareSheet}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-white/10 text-white font-semibold py-2.5 rounded-xl text-sm hover:border-[var(--border-strong)] active:scale-95"
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>

      {/* Channel links */}
      <div className="flex flex-wrap gap-2">
        <a
          href={links.sms}
          onClick={() => recordChannel("sms")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-xs text-gray-300 hover:border-[var(--border-strong)]"
        >
          💬 SMS
        </a>
        <a
          href={links.whatsapp}
          onClick={() => recordChannel("whatsapp")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-xs text-gray-300 hover:border-[var(--border-strong)]"
        >
          🟢 WhatsApp
        </a>
        <a
          href={links.mailto}
          onClick={() => recordChannel("mailto")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-xs text-gray-300 hover:border-[var(--border-strong)]"
        >
          ✉️ Email app
        </a>
      </div>

      {/* Email invite form */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
        <p className="text-white text-sm font-semibold flex items-center gap-2">
          <Mail size={14} className="text-[var(--accent)]" /> Invite by email
        </p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="friend@example.com"
          className="mt-2 w-full bg-gray-950 border border-white/15 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Optional note (keep it spicy 🔥)"
          rows={2}
          maxLength={500}
          className="mt-2 w-full bg-gray-950 border border-white/15 text-white placeholder-gray-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] resize-none"
        />
        <button
          onClick={sendEmail}
          disabled={busy}
          className="w-full mt-2 py-2.5 rounded-xl font-bold text-sm active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "var(--accent)", color: "#050c1a" }}
        >
          <Mail size={14} /> {busy ? "Sending…" : "Send invite"}
        </button>
      </div>

      {/* Milestone ladder */}
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
        <p className="text-white text-sm font-semibold flex items-center gap-2">
          <Gift size={14} className="text-[var(--accent)]" /> Reward ladder
        </p>
        <div className="space-y-3 mt-2">
          {(
            [
              milestone("invite_send"),
              milestone("referral_signup"),
              milestone("referral_30d"),
            ] as (ReferralStatsResponse["milestones"][number] | undefined)[]
          ).map(m => {
            if (!m) return null;
            return (
              <div
                key={m.key}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 border",
                  m.complete
                    ? "border-[var(--border-strong)] bg-[var(--bg-muted)]"
                    : "border-white/10 bg-gray-900/70",
                )}
              >
                <span
                  className={clsx(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    m.complete
                      ? "bg-[var(--accent)] border-[var(--accent)]"
                      : "border-[var(--text-muted)] opacity-30",
                  )}
                >
                  {m.complete && <Check size={12} className="text-[#050c1a]" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={clsx(
                      "text-sm font-medium",
                      m.complete ? "text-white" : "text-gray-300",
                    )}
                  >
                    {m.label}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">{m.reward}</p>
                </div>
                {m.complete && (
                  <Sparkles size={14} className="text-[var(--accent)]" />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[var(--text-muted)] text-xs mt-2 leading-relaxed">
          Earned so far:{" "}
          <span className="text-[var(--accent)] font-semibold">
            {stats?.total_free_days_earned ?? 0} free Premium days
          </span>{" "}
          · {stats?.total_invites_sent ?? 0} invites sent ·{" "}
          {stats?.signed_up ?? 0} friends joined
        </p>
      </div>

      {/* Recent rewards */}
      {!!stats?.recent_rewards?.length && (
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-4">
          <p className="text-white text-sm font-semibold flex items-center gap-2">
            <MessageCircle size={14} className="text-[var(--accent)]" /> Recent
            rewards
          </p>
          <div className="space-y-1.5 mt-2">
            {(stats.recent_rewards as RewardEvent[]).slice(0, 5).map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-950/60"
              >
                <p className="text-xs text-gray-300 truncate flex-1">
                  {r.reason || r.type}
                </p>
                <span className="text-xs font-bold text-[var(--accent-bright)] flex-shrink-0">
                  +{r.value_days}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

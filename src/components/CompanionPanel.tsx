// CompanionPanel — the premium "AI Companion" tab.
//
// Premium users get the embedded companion (xxxcompanion standalone app,
// served from its own deployment) full-screen inside Surge. The iframe gets
// the user's Supabase access token via postMessage after a ready handshake;
// the companion exchanges it for its own bearer session, so no shared
// accounts and no cookie games. Free users see a branded upsell instead.

import { Crown, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePremium } from "../hooks/usePremium";
import { supabase } from "../lib/supabaseClient";
import type { AppView } from "../types";

const COMPANION_URL = import.meta.env.VITE_COMPANION_URL as string;

function companionOrigin(): string {
  try {
    return new URL(COMPANION_URL).origin;
  } catch {
    return "";
  }
}

export default function CompanionPanel({
  onNavigate,
}: {
  onNavigate?: (v: AppView) => void;
}) {
  const premium = usePremium();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [handshakeDone, setHandshakeDone] = useState(false);
  const [noSession, setNoSession] = useState(false);

  const sendToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setNoSession(true);
      return;
    }
    frameRef.current?.contentWindow?.postMessage(
      { type: "surge-token", token },
      companionOrigin(),
    );
    setHandshakeDone(true);
  }, []);

  useEffect(() => {
    if (!premium.isPremium || !COMPANION_URL) return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== companionOrigin()) return;
      if (event.data?.type === "companion-ready") {
        sendToken();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [premium.isPremium, sendToken]);

  // Premium but unconfigured (missing VITE_COMPANION_URL) — be honest, don't
  // render a blank frame.
  if (premium.isPremium && !COMPANION_URL) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <Sparkles size={28} className="mx-auto text-[var(--accent-bright)]" />
          <p className="mt-3 font-bold">AI Companion</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            This feature isn't configured yet. It'll light up as soon as the
            companion service is live.
          </p>
        </div>
      </div>
    );
  }

  if (premium.isPremium) {
    return (
      <div className="relative h-full min-h-0">
        <iframe
          ref={frameRef}
          src={`${COMPANION_URL.replace(/\/$/, "")}/embed`}
          title="AI Companion"
          className="absolute inset-0 h-full w-full border-0"
          allow="microphone; clipboard-write"
        />
        {!handshakeDone && !noSession && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-sm text-[var(--text-secondary)] animate-pulse">
              Waking up your companion…
            </p>
          </div>
        )}
        {noSession && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-sm text-[var(--text-secondary)] px-6 text-center">
              Session lost — sign in again to use the AI Companion.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Free users: branded upsell.
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] flex items-center justify-center">
        <Sparkles size={26} className="text-[#050c1a]" />
      </div>
      <div className="text-center max-w-xs">
        <p className="font-black text-lg">Your AI Companion</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          A companion who's always up for it — chats, flirts, remembers what you
          like, and never leaves you on read. Custom personalities, your pace,
          your rules.
        </p>
        <p className="mt-3 text-xs text-[var(--accent-bright)] flex items-center justify-center gap-1.5 font-bold">
          <Crown size={13} /> Premium feature
        </p>
        <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">
          Invite a friend and you both get 7 days of Premium free — your
          companion included. No credit card.
        </p>
      </div>
      <button
        type="button"
        onClick={() => onNavigate?.("profile")}
        className="rounded-full bg-[var(--accent-bright)] text-[#050c1a] font-bold text-sm px-6 py-2.5"
      >
        Unlock Premium
      </button>
    </div>
  );
}

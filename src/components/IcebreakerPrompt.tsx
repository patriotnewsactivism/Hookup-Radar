/**
 * IcebreakerPrompt — shows in ChatPage before first message is sent.
 * Gives the user tappable openers based on the other person's profile.
 */
import React from 'react';
import { SurgeUser } from '../types';
import { Zap } from 'lucide-react';

interface Props {
  them: SurgeUser;
  onSelect: (text: string) => void;
}

function buildPrompts(them: SurgeUser): string[] {
  const prompts: string[] = [];
  const name = them.display_name || 'you';

  // Based on looking_for
  if (them.looking_for?.includes('Right Now') || them.looking_for?.includes('Tonight')) {
    prompts.push(`Hey ${name}, still looking to meet up tonight?`);
    prompts.push(`What part of town are you in right now?`);
  }
  if (them.looking_for?.includes('NSA')) {
    prompts.push(`Hey — NSA works for me. You close by?`);
  }
  if (them.looking_for?.includes('FWB')) {
    prompts.push(`Open to FWB situation, just want to see if we vibe first`);
  }
  if (them.looking_for?.includes('Couple Play') || them.looking_for?.includes('Third')) {
    prompts.push(`We're a couple looking for a third — you interested?`);
    prompts.push(`What are you into for group play?`);
  }

  // Based on kinks
  const sharedKink = them.kinks?.[0];
  if (sharedKink) prompts.push(`You're into ${sharedKink}? Same — tell me more 👀`);

  // Based on position
  if (them.position === 'Top') prompts.push(`I'm a bottom — timing working out for you tonight?`);
  if (them.position === 'Bottom') prompts.push(`I'm a top — you nearby?`);
  if (them.position === 'Vers' || them.position === 'Switch') prompts.push(`Vers here too — what are you feeling tonight?`);
  if (them.position === 'Dom') prompts.push(`I've been looking for someone who takes control 👀`);
  if (them.position === 'Sub') prompts.push(`I'm dom — you actually follow through or just say sub?`);

  // Generic solid openers
  prompts.push(`Hey, your profile caught my eye 👀`);
  prompts.push(`Stats?`);
  prompts.push(`You free right now?`);
  prompts.push(`What are you looking for tonight?`);
  prompts.push(`Hosting or travelling?`);

  // Return up to 5 unique
  return [...new Set(prompts)].slice(0, 5);
}

export function IcebreakerPrompt({ them, onSelect }: Props) {
  const prompts = buildPrompts(them);

  return (
    <div className="px-4 py-3 border-b border-white/5">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={12} className="text-purple-400" />
        <span className="text-gray-600 text-xs font-semibold uppercase tracking-wider">Icebreakers</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onSelect(p)}
            className="text-xs text-gray-300 bg-gray-900 border border-white/10 rounded-xl px-3 py-1.5 hover:border-purple-500 hover:text-white active:scale-95 transition-all text-left"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

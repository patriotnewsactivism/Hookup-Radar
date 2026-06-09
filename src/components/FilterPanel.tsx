// src/components/FilterPanel.tsx  —  Enhanced filter panel for Surge
// Adds: body_type filter, ethnicity filter, verified-only toggle
// Preserves all existing filters (orientation, gender, looking_for, kinks, age, distance, online_only)

import React, { useState } from 'react';
import { Filters } from '../hooks/useNearbyUsers';
import { ORIENTATIONS, GENDERS, LOOKING_FOR, KINKS } from '../types';
import { X, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

// Add these to your types.ts if not already present
const BODY_TYPES   = ['Slim', 'Average', 'Athletic', 'Muscular', 'Stocky', 'Large', 'Chubby'];
const ETHNICITIES  = ['Asian', 'Black', 'Latino', 'Middle Eastern', 'Mixed', 'Native', 'South Asian', 'White', 'Other'];

interface Props {
  filters:  Filters;
  onChange: (f: Filters) => void;
  onClose:  () => void;
}

function toggle<T>(arr: T[] | undefined, val: T): T[] {
  if (!arr) return [val];
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function Pill({
  active, onClick, children, color = 'purple',
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; color?: string;
}) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-700 border-purple-500 text-white',
    pink:   'bg-pink-700 border-pink-500 text-white',
    orange: 'bg-orange-700 border-orange-500 text-white',
    cyan:   'bg-cyan-800 border-cyan-500 text-white',
    teal:   'bg-teal-800 border-teal-500 text-white',
    rose:   'bg-rose-800 border-rose-600 text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
        active ? colors[color] : 'bg-gray-900 border-white/10 text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function FilterPanel({ filters, onChange, onClose }: Props) {
  const [local, setLocal] = useState<Filters>({ ...filters });

  const activeCount = [
    local.online_only,
    local.verified_only,
    local.max_distance,
    local.min_age || local.max_age,
    local.orientation?.length,
    local.gender?.length,
    local.looking_for?.length,
    local.kinks?.length,
    local.body_type?.length,
    local.ethnicity?.length,
  ].filter(Boolean).length;

  const apply = () => { onChange(local); onClose(); };
  const clear = () => { setLocal({}); onChange({}); onClose(); };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-lg bg-gray-950 border border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-950 border-b border-white/8 px-4 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            <span className="text-white font-semibold">Filters</span>
            {activeCount > 0 && (
              <span className="bg-purple-700 text-white text-xs rounded-full px-2 py-0.5">{activeCount}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={clear} className="text-gray-500 text-sm hover:text-white transition-colors">
              Clear All
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-6">

          {/* ── Toggles ── */}
          <Section title="Quick Filters">
            <button
              onClick={() => setLocal((p) => ({ ...p, online_only: !p.online_only }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                local.online_only ? 'bg-green-800 border-green-600 text-white' : 'bg-gray-900 border-white/10 text-gray-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${local.online_only ? 'bg-green-400' : 'bg-gray-600'}`} />
              Online Only
            </button>
            <button
              onClick={() => setLocal((p) => ({ ...p, verified_only: !p.verified_only }))}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                local.verified_only ? 'bg-blue-800 border-blue-600 text-white' : 'bg-gray-900 border-white/10 text-gray-400'
              }`}
            >
              ✓ Verified Only
            </button>
          </Section>

          {/* ── Distance ── */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Max Distance: {local.max_distance ? `${(local.max_distance / 5280).toFixed(1)} mi` : 'Any'}
            </p>
            <input
              type="range" min="2640" max="264000" step="2640"
              value={local.max_distance ?? 264000}
              onChange={(e) => setLocal((p) => ({ ...p, max_distance: parseInt(e.target.value) }))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>0.5 mi</span><span>Any</span>
            </div>
          </div>

          {/* ── Age ── */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
              Age: {local.min_age || 18} – {local.max_age || 99}
            </p>
            <div className="flex gap-2">
              <input
                type="number" placeholder="Min" min="18" max="99"
                value={local.min_age ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, min_age: parseInt(e.target.value) || undefined }))}
                className="flex-1 bg-gray-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
              <input
                type="number" placeholder="Max" min="18" max="99"
                value={local.max_age ?? ''}
                onChange={(e) => setLocal((p) => ({ ...p, max_age: parseInt(e.target.value) || undefined }))}
                className="flex-1 bg-gray-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* ── Orientation ── */}
          <Section title="Orientation">
            {ORIENTATIONS.map((o) => (
              <Pill key={o} active={!!local.orientation?.includes(o)} color="purple"
                onClick={() => setLocal((p) => ({ ...p, orientation: toggle(p.orientation, o) }))}>
                {o}
              </Pill>
            ))}
          </Section>

          {/* ── Gender ── */}
          <Section title="Gender">
            {GENDERS.map((g) => (
              <Pill key={g} active={!!local.gender?.includes(g)} color="pink"
                onClick={() => setLocal((p) => ({ ...p, gender: toggle(p.gender, g) }))}>
                {g}
              </Pill>
            ))}
          </Section>

          {/* ── Looking For ── */}
          <Section title="Looking For">
            {LOOKING_FOR.map((lf) => (
              <Pill key={lf} active={!!local.looking_for?.includes(lf)} color="orange"
                onClick={() => setLocal((p) => ({ ...p, looking_for: toggle(p.looking_for, lf) }))}>
                {lf}
              </Pill>
            ))}
          </Section>

          {/* ── Body Type (NEW) ── */}
          <Section title="Body Type">
            {BODY_TYPES.map((bt) => (
              <Pill key={bt} active={!!local.body_type?.includes(bt)} color="teal"
                onClick={() => setLocal((p) => ({ ...p, body_type: toggle(p.body_type, bt) }))}>
                {bt}
              </Pill>
            ))}
          </Section>

          {/* ── Ethnicity (NEW) ── */}
          <Section title="Ethnicity">
            {ETHNICITIES.map((e) => (
              <Pill key={e} active={!!local.ethnicity?.includes(e)} color="rose"
                onClick={() => setLocal((p) => ({ ...p, ethnicity: toggle(p.ethnicity, e) }))}>
                {e}
              </Pill>
            ))}
          </Section>

          {/* ── Kinks ── */}
          <Section title="Into">
            {KINKS.map((k) => (
              <Pill key={k} active={!!local.kinks?.includes(k)} color="cyan"
                onClick={() => setLocal((p) => ({ ...p, kinks: toggle(p.kinks, k) }))}>
                {k}
              </Pill>
            ))}
          </Section>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-950 border-t border-white/8 px-4 py-4">
          <button
            onClick={apply}
            className="w-full bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-2xl py-3 transition-colors"
          >
            Apply Filters{activeCount > 0 ? ` (${activeCount} active)` : ''}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

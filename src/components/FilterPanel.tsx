import React, { useState } from 'react';
import { Filters } from '../hooks/useNearbyUsers';
import { ORIENTATIONS, GENDERS, LOOKING_FOR, KINKS } from '../types';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose: () => void;
}

function toggle<T>(arr: T[] | undefined, val: T): T[] {
  if (!arr) return [val];
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export function FilterPanel({ filters, onChange, onClose }: Props) {
  const [local, setLocal] = useState<Filters>({ ...filters });

  const apply = () => {
    onChange(local);
    onClose();
  };

  const clear = () => {
    setLocal({});
    onChange({});
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-gray-950 rounded-t-3xl w-full max-h-[85vh] overflow-y-auto border-t border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-black text-lg">Filters</h2>
          <div className="flex gap-3">
            <button onClick={clear} className="text-gray-500 text-sm hover:text-white">Clear All</button>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6 pb-8">
          {/* Online only */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Online Only</p>
              <p className="text-gray-500 text-xs">Show only people currently online</p>
            </div>
            <button
              onClick={() => setLocal(p => ({ ...p, online_only: !p.online_only }))}
              className={`w-12 h-6 rounded-full transition-colors ${local.online_only ? 'bg-purple-600' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${local.online_only ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Distance */}
          <div>
            <p className="text-white font-semibold mb-2">
              Max Distance: {local.max_distance ? `${(local.max_distance / 5280).toFixed(1)} mi` : 'Any'}
            </p>
            <input
              type="range"
              min={528} max={52800} step={528}
              value={local.max_distance || 52800}
              onChange={e => setLocal(p => ({ ...p, max_distance: parseInt(e.target.value) }))}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Age */}
          <div>
            <p className="text-white font-semibold mb-2">
              Age: {local.min_age || 18} – {local.max_age || 99}
            </p>
            <div className="flex gap-3">
              <input type="number" min={18} max={99} placeholder="Min" value={local.min_age || ''}
                onChange={e => setLocal(p => ({ ...p, min_age: parseInt(e.target.value) || undefined }))}
                className="flex-1 bg-gray-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
              <input type="number" min={18} max={99} placeholder="Max" value={local.max_age || ''}
                onChange={e => setLocal(p => ({ ...p, max_age: parseInt(e.target.value) || undefined }))}
                className="flex-1 bg-gray-900 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          {/* Orientation */}
          <div>
            <p className="text-white font-semibold mb-2">Orientation</p>
            <div className="flex flex-wrap gap-2">
              {ORIENTATIONS.map(o => (
                <button key={o} onClick={() => setLocal(p => ({ ...p, orientation: toggle(p.orientation, o) }))}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${local.orientation?.includes(o) ? 'bg-purple-700 border-purple-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <p className="text-white font-semibold mb-2">Gender</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(g => (
                <button key={g} onClick={() => setLocal(p => ({ ...p, gender: toggle(p.gender, g) }))}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${local.gender?.includes(g) ? 'bg-pink-700 border-pink-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Looking for */}
          <div>
            <p className="text-white font-semibold mb-2">Looking For</p>
            <div className="flex flex-wrap gap-2">
              {LOOKING_FOR.map(lf => (
                <button key={lf} onClick={() => setLocal(p => ({ ...p, looking_for: toggle(p.looking_for, lf) }))}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${local.looking_for?.includes(lf) ? 'bg-orange-700 border-orange-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>
                  {lf}
                </button>
              ))}
            </div>
          </div>

          {/* Kinks */}
          <div>
            <p className="text-white font-semibold mb-2">Into</p>
            <div className="flex flex-wrap gap-2">
              {KINKS.map(k => (
                <button key={k} onClick={() => setLocal(p => ({ ...p, kinks: toggle(p.kinks, k) }))}
                  className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${local.kinks?.includes(k) ? 'bg-cyan-800 border-cyan-500 text-white' : 'bg-gray-900 border-white/10 text-gray-400'}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={apply}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity"
          >
            Apply Filters
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

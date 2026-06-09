// src/pages/AdminPage.tsx
// ─────────────────────────────────────────────────────────────
//  Admin Moderation Dashboard for Surge / Hookup-Radar
//  Access: verified/admin users only (enforced server-side too)
//
//  Tabs:
//    1. Overview   — key stats
//    2. Reports    — pending user reports, resolve / dismiss / strike
//    3. Spots      — approve or reject community-submitted spots
//    4. Users      — search users, view strikes, ban/unban
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  BarChart2, Flag, MapPin, Users, CheckCircle,
  XCircle, AlertTriangle, ShieldOff, Shield, ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────
interface Report {
  id: string;
  reporter_name: string;
  reporter_username: string;
  reported_name: string;
  reported_username: string;
  reported_photo: string;
  reported_id: string;
  reason: string;
  details?: string;
  status: string;
}

interface Spot {
  id: string;
  name: string;
  description?: string;
  category: string;
  address: string;
  submitted_by?: string;
}

interface Stats {
  total_users: number;
  online_users: number;
  pending_reports: number;
  pending_spots: number;
  active_bans: number;
  total_strikes: number;
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  return (
    <div className={`bg-gray-900 border border-white/8 rounded-2xl p-4 flex items-center gap-4`}>
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ── Report row ────────────────────────────────────────────────
function ReportRow({ report, onResolve, onDismiss, onStrike, onBan }: {
  report: Report;
  onResolve: () => void;
  onDismiss: () => void;
  onStrike:  () => void;
  onBan:     () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900/60 border border-white/8 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {report.reported_photo ? (
          <img src={report.reported_photo} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">?</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            <span className="text-red-400">@{report.reported_username}</span>
            <span className="text-gray-500 mx-1">reported by</span>
            <span className="text-gray-300">@{report.reporter_username}</span>
          </p>
          <p className="text-xs text-gray-500 truncate">{report.reason}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          report.status === 'pending'
            ? 'border-yellow-500/40 text-yellow-400 bg-yellow-950/30'
            : report.status === 'resolved'
            ? 'border-green-500/40 text-green-400 bg-green-950/30'
            : 'border-gray-500/40 text-gray-400 bg-gray-900'
        }`}>
          {report.status}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/8"
          >
            <div className="px-4 py-3 space-y-3">
              {report.details && (
                <p className="text-sm text-gray-400 bg-gray-950/50 rounded-xl px-3 py-2">{report.details}</p>
              )}
              {report.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={onResolve}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-900/40 border border-green-700/40 text-green-400 text-xs hover:bg-green-900/70 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" /> Resolve
                  </button>
                  <button onClick={onDismiss}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-800 border border-white/10 text-gray-400 text-xs hover:bg-gray-700 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Dismiss
                  </button>
                  <button onClick={onStrike}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-900/40 border border-yellow-700/40 text-yellow-400 text-xs hover:bg-yellow-900/70 transition-colors">
                    <AlertTriangle className="w-3.5 h-3.5" /> Strike User
                  </button>
                  <button onClick={onBan}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-900/40 border border-red-700/40 text-red-400 text-xs hover:bg-red-900/70 transition-colors">
                    <ShieldOff className="w-3.5 h-3.5" /> Ban User
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Spot row ──────────────────────────────────────────────────
function SpotRow({ spot, onApprove, onReject }: {
  spot: Spot; onApprove: () => void; onReject: () => void;
}) {
  return (
    <div className="bg-gray-900/60 border border-white/8 rounded-2xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{spot.name}</p>
        <p className="text-xs text-gray-500 truncate">{spot.category} · {spot.address}</p>
        {spot.description && <p className="text-xs text-gray-600 mt-0.5 truncate">{spot.description}</p>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onApprove}
          className="px-3 py-1.5 rounded-xl bg-green-900/40 border border-green-700/40 text-green-400 text-xs hover:bg-green-900/70 transition-colors flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Approve
        </button>
        <button onClick={onReject}
          className="px-3 py-1.5 rounded-xl bg-red-900/40 border border-red-700/40 text-red-400 text-xs hover:bg-red-900/70 transition-colors flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Reject
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
type Tab = 'overview' | 'reports' | 'spots';

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [reportFilter, setReportFilter] = useState<string>('pending');

  const stats        = useQuery(api.surgeModeration.getStats) as Stats | undefined;
  const reports      = (useQuery(api.surgeModeration.listReports, { status: reportFilter }) ?? []) as Report[];
  const pendingSpots = (useQuery(api.surgeModeration.listPendingSpots) ?? []) as Spot[];

  const resolveReport = useMutation(api.surgeModeration.resolveReport);
  const issueStrike   = useMutation(api.surgeModeration.issueStrike);
  const reviewSpot    = useMutation(api.surgeModeration.reviewSpot);

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { key: 'reports',  label: `Reports${stats ? ` (${stats.pending_reports})` : ''}`, icon: <Flag className="w-4 h-4" /> },
    { key: 'spots',    label: `Spots${stats ? ` (${stats.pending_spots})` : ''}`,   icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-white/8 px-4 py-3 flex items-center gap-3">
        <Shield className="w-5 h-5 text-purple-400" />
        <h1 className="text-white font-bold text-lg">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2 border-b border-white/8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-purple-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && stats && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Users className="w-5 h-5 text-cyan-400" />}    label="Total Users"     value={stats.total_users}     color="bg-cyan-900" />
            <StatCard icon={<Users className="w-5 h-5 text-green-400" />}   label="Online Now"      value={stats.online_users}    color="bg-green-900" />
            <StatCard icon={<Flag className="w-5 h-5 text-yellow-400" />}   label="Pending Reports" value={stats.pending_reports} color="bg-yellow-900" />
            <StatCard icon={<MapPin className="w-5 h-5 text-orange-400" />} label="Pending Spots"   value={stats.pending_spots}   color="bg-orange-900" />
            <StatCard icon={<ShieldOff className="w-5 h-5 text-red-400" />} label="Active Bans"     value={stats.active_bans}     color="bg-red-900" />
            <StatCard icon={<AlertTriangle className="w-5 h-5 text-purple-400" />} label="Total Strikes" value={stats.total_strikes} color="bg-purple-900" />
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === 'reports' && (
          <>
            <div className="flex gap-2">
              {['pending', 'resolved', 'dismissed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setReportFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors capitalize ${
                    reportFilter === s
                      ? 'bg-purple-700 border-purple-500 text-white'
                      : 'bg-gray-900 border-white/10 text-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {reports.length === 0 ? (
              <div className="py-12 text-center text-gray-600">
                No {reportFilter} reports 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <ReportRow
                    key={r.id}
                    report={r}
                    onResolve={() => resolveReport({ report_id: r.id as any, status: 'resolved' })}
                    onDismiss={() => resolveReport({ report_id: r.id as any, status: 'dismissed' })}
                    onStrike={() => {
                      const reason = prompt('Reason for strike:');
                      if (!reason) return;
                      issueStrike({
                        user_id:   r.reported_id,
                        reason,
                        report_id: r.id as any,
                        is_ban:    false,
                      });
                      resolveReport({ report_id: r.id as any, status: 'resolved' });
                    }}
                    onBan={() => {
                      const reason = prompt('Reason for ban:');
                      if (!reason) return;
                      if (!confirm(`Permanently ban @${r.reported_username}?`)) return;
                      issueStrike({
                        user_id:   r.reported_id,
                        reason,
                        report_id: r.id as any,
                        is_ban:    true,
                      });
                      resolveReport({ report_id: r.id as any, status: 'resolved' });
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── SPOTS ── */}
        {tab === 'spots' && (
          <>
            {pendingSpots.length === 0 ? (
              <div className="py-12 text-center text-gray-600">
                No spots pending approval 🎉
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSpots.map((s) => (
                  <SpotRow
                    key={s.id}
                    spot={s}
                    onApprove={() => reviewSpot({ spot_id: s.id as any, approved: true })}
                    onReject={() => {
                      if (confirm(`Reject "${s.name}"? This will delete it.`)) {
                        reviewSpot({ spot_id: s.id as any, approved: false });
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

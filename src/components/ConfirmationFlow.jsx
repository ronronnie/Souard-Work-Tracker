import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/helpers';

function ConfirmDialog({ entry, ownerNames, onConfirm, onCancel }) {
  const [selectedOwner, setSelectedOwner] = useState(ownerNames[0] || 'Ronnie');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Approve Entry</h3>
            <p className="text-xs text-slate-500">{formatDate(entry.date)} · logged by {entry.loggedBy}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-4 bg-slate-800 rounded-lg px-3 py-2.5 leading-relaxed">
          "{entry.description}"
        </p>
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
            Confirming as
          </label>
          <div className="relative">
            <select
              value={selectedOwner}
              onChange={e => setSelectedOwner(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 appearance-none cursor-pointer focus:outline-none focus:border-brand-500"
            >
              {ownerNames.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(selectedOwner)} className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors">
            Confirm Day
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationFlow() {
  const { entries, settings, confirmEntry, rejectEntry } = useApp();
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const pending = entries
    .filter(e => e.status === 'Pending' || e.status === 'Pending Confirmation')
    .sort((a, b) => b.date.localeCompare(a.date));

  const recent = entries
    .filter(e => e.status === 'Approved' || e.status === 'Rejected' || e.status === 'Confirmed' || e.status === 'Cancelled')
    .sort((a, b) => new Date(b.confirmedAt || b.createdAt) - new Date(a.confirmedAt || a.createdAt))
    .slice(0, 8);

  const handleConfirm = (owner) => {
    confirmEntry(confirmTarget.id, owner);
    setConfirmTarget(null);
  };

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Confirmations</h1>
        <p className="text-sm text-slate-500 mt-1">
          {pending.length > 0
            ? `${pending.length} ${pending.length === 1 ? 'entry' : 'entries'} awaiting owner confirmation`
            : 'All entries are up to date'}
        </p>
      </div>

      {/* Pending entries */}
      {pending.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-14 text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={24} className="text-emerald-400" />
          </div>
          <p className="text-slate-300 font-medium">All caught up!</p>
          <p className="text-slate-600 text-sm mt-1">No pending entries to review.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map(entry => (
            <div
              key={entry.id}
              className="bg-slate-900 border border-amber-500/20 rounded-xl p-4 md:p-5 hover:border-amber-500/35 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={17} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-slate-400 font-medium">{formatDate(entry.date)}</span>
                    <span className="text-xs text-slate-600">Logged by {entry.loggedBy}</span>
                  </div>
                  {/* Description */}
                  <p className="text-sm text-slate-200 leading-snug mb-3 break-words overflow-hidden">{entry.description || '—'}</p>
                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmTarget(entry)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-semibold hover:bg-emerald-500/25 hover:border-emerald-500/40 transition-colors"
                    >
                      <CheckCircle2 size={13} />
                      Approve
                    </button>
                    <button
                      onClick={() => rejectEntry(entry.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-700/50 text-slate-400 border border-slate-700 text-xs font-semibold hover:bg-brand-500/10 hover:text-brand-400 hover:border-brand-500/30 transition-colors"
                    >
                      <XCircle size={13} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recently resolved */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recently Resolved
          </h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-800">
              {recent.map(entry => {
                const isExpanded = expandedIds.has(entry.id);
                const isLong = (entry.description || '').length > 80;
                return (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                    <div className="mt-0.5 shrink-0">
                      {(entry.status === 'Approved' || entry.status === 'Confirmed') ? (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      ) : (
                        <XCircle size={15} className="text-brand-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-slate-300 break-words overflow-hidden ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                        {entry.description || '—'}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => toggleExpand(entry.id)}
                          className="text-xs text-slate-500 hover:text-brand-400 transition-colors mt-0.5"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5">
                        {formatDate(entry.date)}
                        {entry.confirmedBy ? ` · by ${entry.confirmedBy}` : ''}
                      </p>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                      (entry.status === 'Approved' || entry.status === 'Confirmed')
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-brand-500/15 text-brand-400'
                    }`}>
                      {entry.status === 'Confirmed' ? 'Approved' : entry.status === 'Cancelled' ? 'Rejected' : entry.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmTarget && (
        <ConfirmDialog
          entry={confirmTarget}
          ownerNames={settings.ownerNames}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

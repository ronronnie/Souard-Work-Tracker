import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Pencil, Trash2, ChevronDown, Calendar, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getMonthKey, getAllMonthKeys, getMonthLabel } from '../utils/helpers';

// New canonical statuses
const STATUSES = ['Pending', 'Approved', 'Rejected'];

const STATUS_PILL = {
  'Pending':  'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  'Approved': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  'Rejected': 'bg-brand-500/15 text-brand-400 border border-brand-500/25',
  // legacy fallbacks (for any old DB rows)
  'Confirmed':            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  'Pending Confirmation': 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  'Cancelled':            'bg-brand-500/15 text-brand-400 border border-brand-500/25',
};

const statusLabel = (s) => {
  if (s === 'Confirmed' || s === 'Approved') return 'Approved';
  if (s === 'Cancelled' || s === 'Rejected') return 'Rejected';
  return 'Pending';
};

/* ─── Toast ─── */
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl animate-slide-up">
      <CheckCircle2 size={17} />
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-1 opacity-75 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

/* ─── Add / Edit Entry Modal ─── */
function EntryModal({ entry, settings, isAdmin, freelancerName, saving, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);

  const defaultLoggedBy = isAdmin
    ? (entry?.loggedBy || settings.ownerNames[0] || 'Ronnie')
    : freelancerName;

  const [form, setForm] = useState({
    date:        entry?.date        || today,
    loggedBy:    defaultLoggedBy,
    description: entry?.description || '',
  });
  const [error, setError] = useState('');
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date)               { setError('Please select a date.');       return; }
    if (!form.description.trim()) { setError('Please add a description.');   return; }
    onSave({ ...form, status: 'Pending', workType: 'Other' });
  };

  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide';
  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full md:max-w-lg bg-slate-900 border border-slate-800 md:rounded-2xl rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-100">
            {entry ? 'Edit Entry' : 'Log Work Day'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className={isAdmin ? 'grid grid-cols-2 gap-4' : ''}>
            {/* Date */}
            <div>
              <label className={labelCls}>Date</label>
              <input
                ref={firstInputRef}
                type="date"
                value={form.date}
                max={!isAdmin ? today : undefined}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
                required
              />
            </div>

            {/* Logged By — admin only */}
            {isAdmin && (
              <div>
                <label className={labelCls}>Logged By</label>
                <div className="relative">
                  <select
                    value={form.loggedBy}
                    onChange={e => set('loggedBy', e.target.value)}
                    className={inputCls + ' appearance-none cursor-pointer pr-8'}
                  >
                    {settings.ownerNames.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description / Notes</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={4}
              placeholder="Describe the work done today…"
              className={inputCls + ' resize-none placeholder:text-slate-600'}
            />
          </div>

          {error && (
            <p className="text-xs text-brand-400 bg-brand-500/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (entry ? 'Save Changes' : 'Log Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Dialog ─── */
function DeleteDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-up">
        <h3 className="text-base font-semibold text-slate-100 mb-2">Delete Entry?</h3>
        <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main WorkLog view ─── */
export default function WorkLog() {
  const { entries, settings, addEntry, updateEntry, deleteEntry } = useApp();
  const { isAdmin, isFreelancer } = useAuth();

  const freelancerName = settings.freelancerName;

  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [saving,   setSaving]     = useState(false);
  const [toast,    setToast]      = useState(false);
  const [filterMonth,  setFilterMonth]  = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const allMonthKeys = getAllMonthKeys(entries);

  const normalizeStatus = (s) => {
    if (s === 'Confirmed') return 'Approved';
    if (s === 'Cancelled') return 'Rejected';
    if (s === 'Pending Confirmation') return 'Pending';
    return s;
  };

  const filtered = entries
    .filter(e => filterMonth  === 'all' || getMonthKey(e.date) === filterMonth)
    .filter(e => filterStatus === 'all' || normalizeStatus(e.status) === filterStatus)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editEntry) {
        await updateEntry(editEntry.id, form);
      } else {
        await addEntry(form);
      }
      setShowModal(false);
      setEditEntry(null);
      setToast(true);
    } finally {
      setSaving(false);
    }
  };

  const closeToast = useCallback(() => setToast(false), []);

  const openEdit = (entry) => {
    setEditEntry(entry);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (deleteId) deleteEntry(deleteId);
    setDeleteId(null);
  };

  const selectCls = 'bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer';

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Work Log</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <button
          onClick={() => { setEditEntry(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600 transition-colors shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Log Day</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-brand-500 appearance-none cursor-pointer"
          >
            <option value="all">All months</option>
            {allMonthKeys.map(mk => (
              <option key={mk} value={mk}>{getMonthLabel(mk)}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {(filterMonth !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => { setFilterMonth('all'); setFilterStatus('all'); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-200 transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Entry cards — mobile */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 text-sm">No entries found.</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-brand-400 hover:underline">Log a work day</button>
          </div>
        )}
        {filtered.map(entry => (
          <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[entry.status] || STATUS_PILL['Pending']}`}>
                {statusLabel(entry.status)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                  <Pencil size={13} />
                </button>
                {isAdmin && (
                  <button onClick={() => setDeleteId(entry.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-200 mb-1 leading-snug">{entry.description || '—'}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatDate(entry.date)}</span>
              <span>·</span>
              <span>{entry.loggedBy}</span>
              {entry.confirmedBy && (
                <><span>·</span><span className="text-emerald-600">✓ {entry.confirmedBy}</span></>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Entry table — desktop */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 text-sm">No entries found.</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm text-brand-400 hover:underline">Log a work day</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Logged By</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap font-mono text-xs">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{entry.loggedBy}</td>
                  <td className="px-4 py-3.5 text-slate-300 max-w-sm">
                    <p className="truncate">{entry.description || '—'}</p>
                    {entry.confirmedBy && (
                      <p className="text-xs text-emerald-600 mt-0.5">Approved by {entry.confirmedBy}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[entry.status] || STATUS_PILL['Pending']}`}>
                      {statusLabel(entry.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleteId(entry.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {toast && <Toast message="Entry logged successfully" onClose={closeToast} />}
      {showModal && (
        <EntryModal
          entry={editEntry}
          settings={settings}
          isAdmin={isAdmin}
          freelancerName={freelancerName}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditEntry(null); }}
        />
      )}
      {deleteId && (
        <DeleteDialog onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
}

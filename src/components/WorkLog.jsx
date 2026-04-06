import { useState, useEffect, useRef } from 'react';
import { Plus, X, Pencil, Trash2, ChevronDown, Filter, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDate, getCurrentMonthKey, getMonthKey, getAllMonthKeys, getMonthLabel } from '../utils/helpers';

const WORK_TYPES = ['Photography', 'Videography', 'Both', 'Editing', 'Travel Day', 'Other'];
const STATUSES   = ['Pending Confirmation', 'Confirmed', 'Cancelled'];

const STATUS_PILL = {
  'Confirmed':            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  'Pending Confirmation': 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  'Cancelled':            'bg-slate-500/15 text-slate-400 border border-slate-500/25',
};
const TYPE_PILL = {
  Photography:  'bg-sky-500/15 text-sky-400',
  Videography:  'bg-violet-500/15 text-violet-400',
  Both:         'bg-indigo-500/15 text-indigo-400',
  Editing:      'bg-teal-500/15 text-teal-400',
  'Travel Day': 'bg-amber-500/15 text-amber-400',
  Other:        'bg-slate-500/15 text-slate-400',
};

/* ─── Add / Edit Entry Modal ─── */
function EntryModal({ entry, settings, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const loggedByOptions = ['Freelancer', ...settings.ownerNames];

  const [form, setForm] = useState({
    date:      entry?.date      || today,
    loggedBy:  entry?.loggedBy  || 'Freelancer',
    workType:  entry?.workType  || 'Photography',
    description: entry?.description || '',
    status:    entry?.status    || 'Pending Confirmation',
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
    if (!form.date) { setError('Please select a date.'); return; }
    if (!form.description.trim()) { setError('Please add a description.'); return; }
    onSave(form);
  };

  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide';
  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors';
  const selectCls = inputCls + ' cursor-pointer';

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
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className={labelCls}>Date</label>
              <input
                ref={firstInputRef}
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
                required
              />
            </div>
            {/* Logged By */}
            <div>
              <label className={labelCls}>Logged By</label>
              <select value={form.loggedBy} onChange={e => set('loggedBy', e.target.value)} className={selectCls}>
                {loggedByOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label className={labelCls}>Work Type</label>
            <div className="grid grid-cols-3 gap-2">
              {WORK_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('workType', t)}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                    form.workType === t
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description / Notes</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              placeholder="e.g. Brand shoot — hero & product detail shots for summer launch"
              className={inputCls + ' resize-none placeholder:text-slate-600'}
            />
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Status</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all leading-tight ${
                    form.status === s
                      ? s === 'Confirmed'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : s === 'Cancelled'
                        ? 'bg-slate-500/20 border-slate-500/50 text-slate-300'
                        : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {s === 'Pending Confirmation' ? 'Pending' : s}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-brand-400 bg-brand-500/10 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
              {entry ? 'Save Changes' : 'Log Entry'}
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

  const [showModal, setShowModal]   = useState(false);
  const [editEntry, setEditEntry]   = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]   = useState('all');

  const allMonthKeys = getAllMonthKeys(entries);

  const filtered = entries
    .filter(e => filterMonth  === 'all' || getMonthKey(e.date) === filterMonth)
    .filter(e => filterStatus === 'all' || e.status === filterStatus)
    .filter(e => filterType   === 'all' || e.workType === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleSave = (form) => {
    if (editEntry) {
      updateEntry(editEntry.id, form);
    } else {
      addEntry(form);
    }
    setShowModal(false);
    setEditEntry(null);
  };

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

        <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
            <option value="all">All types</option>
            {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        {(filterMonth !== 'all' || filterStatus !== 'all' || filterType !== 'all') && (
          <button
            onClick={() => { setFilterMonth('all'); setFilterStatus('all'); setFilterType('all'); }}
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_PILL[entry.workType] || 'bg-slate-700 text-slate-400'}`}>
                  {entry.workType}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_PILL[entry.status]}`}>
                  {entry.status === 'Pending Confirmation' ? 'Pending' : entry.status}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setDeleteId(entry.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-200 mb-1 leading-snug">{entry.description || '—'}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>{formatDate(entry.date)}</span>
              <span>·</span>
              <span>{entry.loggedBy}</span>
              {entry.confirmedBy && <><span>·</span><span className="text-emerald-600">✓ {entry.confirmedBy}</span></>}
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
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap font-mono text-xs">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{entry.loggedBy}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${TYPE_PILL[entry.workType] || 'bg-slate-700 text-slate-400'}`}>
                      {entry.workType}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 max-w-xs">
                    <p className="truncate">{entry.description || '—'}</p>
                    {entry.confirmedBy && (
                      <p className="text-xs text-emerald-600 mt-0.5">Confirmed by {entry.confirmedBy}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_PILL[entry.status]}`}>
                      {entry.status === 'Pending Confirmation' ? 'Pending' : entry.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(entry)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(entry.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <EntryModal
          entry={editEntry}
          settings={settings}
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

import { CheckCircle2, Clock, AlertTriangle, ChevronRight, Plus, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency, formatDateShort,
  getCurrentMonthKey, getMonthLabel,
  calculateMonthStats, getAllMonthKeys,
} from '../utils/helpers';

const STATUS_COLORS = {
  'Approved':             'bg-emerald-500/15 text-emerald-400',
  'Confirmed':            'bg-emerald-500/15 text-emerald-400',
  'Pending':              'bg-amber-500/15 text-amber-400',
  'Pending Confirmation': 'bg-amber-500/15 text-amber-400',
  'Rejected':             'bg-brand-500/15 text-brand-400',
  'Cancelled':            'bg-slate-500/15 text-slate-400',
};

function StatCard({ label, value, sub, icon: Icon, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        flex-1 min-w-0 bg-slate-900 rounded-xl p-4 md:p-5 border border-slate-800 text-left
        transition-all duration-150
        ${onClick ? 'hover:border-slate-700 hover:bg-slate-800/60 cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider leading-none mb-2">{label}</p>
          <p className={`text-2xl md:text-3xl font-bold leading-none tabular-nums ${accent}`}>{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1.5 leading-none">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accent === 'text-brand-400' ? 'bg-brand-500/15' : accent === 'text-emerald-400' ? 'bg-emerald-500/15' : accent === 'text-amber-400' ? 'bg-amber-500/15' : 'bg-slate-700'}`}>
          <Icon size={18} className={accent} />
        </div>
      </div>
    </button>
  );
}

export default function Dashboard({ onNavigate }) {
  const { entries, payments, settings } = useApp();
  const { isAdmin } = useAuth();

  const currentMonthKey = getCurrentMonthKey();
  const currentStats = calculateMonthStats(entries, payments, currentMonthKey, settings);
  const pendingEntries = entries.filter(e => e.status === 'Pending' || e.status === 'Pending Confirmation');
  const pendingCount = pendingEntries.length;

  // Total outstanding balance across all months
  const allMonthKeys = getAllMonthKeys(entries);
  const totalOutstanding = allMonthKeys.reduce((sum, mk) => {
    const s = calculateMonthStats(entries, payments, mk, settings);
    return sum + s.balance;
  }, 0);

  // Recent activity (last 5 entries, all statuses)
  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const currentMonthName = getMonthLabel(currentMonthKey);

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-1">
          {settings.projectName}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">{currentMonthName}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Days Confirmed"
          value={currentStats.daysWorked}
          sub={`this month · ${currentStats.pendingDays} pending`}
          icon={CheckCircle2}
          accent="text-emerald-400"
          onClick={() => onNavigate('worklog')}
        />
        <StatCard
          label="Pending Approval"
          value={pendingCount}
          sub={pendingCount === 1 ? 'entry awaiting' : 'entries awaiting'}
          icon={Clock}
          accent="text-amber-400"
          onClick={isAdmin ? () => onNavigate('confirmations') : null}
        />
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          sub="across all months"
          icon={TrendingUp}
          accent={totalOutstanding > 0 ? 'text-brand-400' : 'text-slate-400'}
          onClick={() => onNavigate('summary')}
        />
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && isAdmin && (
        <button
          onClick={() => onNavigate('confirmations')}
          className="w-full bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-left hover:bg-amber-500/15 transition-colors mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                {pendingCount} {pendingCount === 1 ? 'entry' : 'entries'} need confirmation
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Tap to review &amp; approve →</p>
            </div>
          </div>
        </button>
      )}
      {pendingCount > 0 && !isAdmin && (
        <div className="w-full bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-300">
                {pendingCount} {pendingCount === 1 ? 'entry' : 'entries'} awaiting approval
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Owners will confirm these shortly</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 mb-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
          <button
            onClick={() => onNavigate('worklog')}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-400 transition-colors"
          >
            View all <ChevronRight size={13} />
          </button>
        </div>
        <div className="divide-y divide-slate-800">
          {recent.length === 0 && (
            <p className="text-sm text-slate-600 px-5 py-10 text-center">No entries yet.</p>
          )}
          {recent.map(entry => (
            <div key={entry.id} className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-slate-400">{formatDateShort(entry.date)}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">{entry.loggedBy}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-snug truncate">{entry.description || '—'}</p>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[entry.status]}`}>
                  {entry.status === 'Pending Confirmation' ? 'Pending' : entry.status === 'Confirmed' ? 'Approved' : entry.status === 'Cancelled' ? 'Rejected' : entry.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick add */}
      <button
        onClick={() => onNavigate('worklog')}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-slate-700 text-sm text-slate-500 hover:border-brand-500/50 hover:text-brand-400 hover:bg-brand-500/5 transition-all duration-150"
      >
        <Plus size={16} />
        Log a work day
      </button>
    </div>
  );
}

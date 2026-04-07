import { CheckCircle2, Clock, IndianRupee, AlertTriangle, ChevronRight, Plus, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency, formatDate, formatDateShort,
  getCurrentMonthKey, getMonthKey, getMonthLabel,
  getDailyRate, calculateMonthStats, getAllMonthKeys,
} from '../utils/helpers';

const WORK_TYPE_COLORS = {
  Photography:  'bg-sky-500/15 text-sky-400',
  Videography:  'bg-violet-500/15 text-violet-400',
  Both:         'bg-indigo-500/15 text-indigo-400',
  Editing:      'bg-teal-500/15 text-teal-400',
  'Travel Day': 'bg-amber-500/15 text-amber-400',
  Other:        'bg-slate-500/15 text-slate-400',
};

const STATUS_COLORS = {
  'Confirmed':            'bg-emerald-500/15 text-emerald-400',
  'Pending Confirmation': 'bg-amber-500/15 text-amber-400',
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
  const dailyRate = getDailyRate(settings.monthlyRemuneration, settings.workingDaysBasis);

  const currentStats = calculateMonthStats(entries, payments, currentMonthKey, settings);
  const pendingEntries = entries.filter(e => e.status === 'Pending Confirmation');
  const pendingCount = pendingEntries.length;

  // Total outstanding balance across all months
  const allMonthKeys = getAllMonthKeys(entries);
  const totalOutstanding = allMonthKeys.reduce((sum, mk) => {
    const s = calculateMonthStats(entries, payments, mk, settings);
    return sum + s.balance;
  }, 0);

  // Recent activity (last 6 entries, all statuses)
  const recent = [...entries]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Days Confirmed"
          value={currentStats.daysWorked}
          sub={`this month · ${currentStats.pendingDays} pending`}
          icon={CheckCircle2}
          accent="text-emerald-400"
          onClick={() => onNavigate('worklog')}
        />
        <StatCard
          label="Amount Due"
          value={formatCurrency(currentStats.amountDue)}
          sub={`${currentStats.daysWorked} × ${formatCurrency(dailyRate)}`}
          icon={IndianRupee}
          accent="text-brand-400"
          onClick={() => onNavigate('summary')}
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

      {/* Two-column layout on md+ */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent activity */}
        <div className="bg-slate-900 rounded-xl border border-slate-800">
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
              <p className="text-sm text-slate-600 px-5 py-8 text-center">No entries yet.</p>
            )}
            {recent.map(entry => (
              <div key={entry.id} className="px-5 py-3.5 hover:bg-slate-800/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${WORK_TYPE_COLORS[entry.workType] || 'bg-slate-700 text-slate-400'}`}>
                        {entry.workType}
                      </span>
                      <span className="text-xs text-slate-500">{formatDateShort(entry.date)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 leading-snug truncate">{entry.description}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{entry.loggedBy}</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[entry.status]}`}>
                    {entry.status === 'Pending Confirmation' ? 'Pending' : entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: pending + quick actions */}
        <div className="space-y-4">
          {/* Pending confirmations call-to-action */}
          {pendingCount > 0 && isAdmin && (
            <button
              onClick={() => onNavigate('confirmations')}
              className="w-full bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-left hover:bg-amber-500/15 transition-colors group"
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
            <div className="w-full bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
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

          {/* Month breakdown */}
          <div className="bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-slate-200">Month Balances</h2>
              <button
                onClick={() => onNavigate('summary')}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-brand-400 transition-colors"
              >
                Full summary <ChevronRight size={13} />
              </button>
            </div>
            <div className="divide-y divide-slate-800">
              {allMonthKeys.slice(0, 4).map(mk => {
                const s = calculateMonthStats(entries, payments, mk, settings);
                const statusColor = s.paymentStatus === 'Paid'
                  ? 'text-emerald-400'
                  : s.paymentStatus === 'Partial'
                  ? 'text-amber-400'
                  : s.paymentStatus === 'No Work'
                  ? 'text-slate-600'
                  : 'text-brand-400';
                return (
                  <div key={mk} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/40">
                    <div>
                      <p className="text-sm text-slate-300">{getMonthLabel(mk)}</p>
                      <p className="text-xs text-slate-600">{s.daysWorked} days · {formatCurrency(s.amountDue)} due</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${statusColor}`}>
                        {s.paymentStatus === 'No Work' ? '—' : formatCurrency(s.balance)}
                      </p>
                      <p className={`text-xs ${statusColor} opacity-80`}>{s.paymentStatus}</p>
                    </div>
                  </div>
                );
              })}
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
      </div>
    </div>
  );
}

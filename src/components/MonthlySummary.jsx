import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, CheckCircle2, Clock, Wallet, ReceiptText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency, formatDate,
  getCurrentMonthKey, getMonthLabel, getMonthShort,
  prevMonth, nextMonth,
  calculateMonthStats, getAllMonthKeys,
  exportSummaryToCSV,
} from '../utils/helpers';

const PAYMENT_STATUS_STYLE = {
  Paid:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Partial:   'bg-amber-500/15 text-amber-400 border-amber-500/25',
  Pending:   'bg-brand-500/15 text-brand-400 border-brand-500/25',
  'No Work': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
};

const TYPE_PILL = {
  Photography:  'text-sky-400',
  Videography:  'text-violet-400',
  Both:         'text-indigo-400',
  Editing:      'text-teal-400',
  'Travel Day': 'text-amber-400',
  Other:        'text-slate-400',
};

export default function MonthlySummary() {
  const { entries, payments, settings, updatePayment } = useApp();
  const { isAdmin } = useAuth();

  const allMonthKeys = getAllMonthKeys(entries);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());

  const stats = calculateMonthStats(entries, payments, selectedMonth, settings);

  // Payment form state
  const [payForm, setPayForm] = useState({
    amountPaid: String(stats.amountPaid || ''),
    paymentDate: stats.paymentDate || '',
    notes: stats.notes || '',
  });
  const [saved, setSaved] = useState(false);

  const handleMonthChange = (mk) => {
    setSelectedMonth(mk);
    const s = calculateMonthStats(entries, payments, mk, settings);
    setPayForm({
      amountPaid: String(s.amountPaid || ''),
      paymentDate: s.paymentDate || '',
      notes: s.notes || '',
    });
    setSaved(false);
  };

  const handleSavePayment = (e) => {
    e.preventDefault();
    updatePayment(selectedMonth, {
      amountPaid: Number(payForm.amountPaid) || 0,
      paymentDate: payForm.paymentDate,
      notes: payForm.notes,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportCSV = () => {
    const rows = allMonthKeys.map(mk => {
      const s = calculateMonthStats(entries, payments, mk, settings);
      return {
        monthLabel: getMonthLabel(mk),
        daysWorked: s.daysWorked,
        dailyRate: s.dailyRate,
        amountDue: s.amountDue,
        amountPaid: s.amountPaid,
        balance: s.balance,
        paymentStatus: s.paymentStatus,
        paymentDate: s.paymentDate,
        notes: s.notes,
      };
    });
    exportSummaryToCSV(rows);
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors';
  const labelCls = 'block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5';

  const canGoPrev = allMonthKeys.includes(prevMonth(selectedMonth));
  const canGoNext = selectedMonth < getCurrentMonthKey();

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Monthly Summary</h1>
          <p className="text-sm text-slate-500 mt-1">Track payments by month</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800/50 transition-colors shrink-0"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">CSV</span>
        </button>
      </div>

      {/* Month navigator */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => handleMonthChange(prevMonth(selectedMonth))}
          disabled={!canGoPrev}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="relative flex-1 max-w-xs">
          <select
            value={selectedMonth}
            onChange={e => handleMonthChange(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-100 text-center appearance-none cursor-pointer focus:outline-none focus:border-brand-500"
          >
            {allMonthKeys.map(mk => (
              <option key={mk} value={mk}>{getMonthLabel(mk)}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleMonthChange(nextMonth(selectedMonth))}
          disabled={!canGoNext}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <span className={`ml-auto text-xs font-semibold px-3 py-1.5 rounded-full border ${PAYMENT_STATUS_STYLE[stats.paymentStatus]}`}>
          {stats.paymentStatus}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Days Confirmed', value: stats.daysWorked, sub: `${stats.pendingDays} still pending`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          { label: 'Amount Due', value: formatCurrency(stats.amountDue), sub: `@ ${formatCurrency(stats.dailyRate)}/day`, icon: ReceiptText, color: 'text-brand-400', bg: 'bg-brand-500/15' },
          { label: 'Amount Paid', value: formatCurrency(stats.amountPaid), sub: stats.paymentDate ? `on ${formatDate(stats.paymentDate)}` : 'not yet paid', icon: Wallet, color: 'text-sky-400', bg: 'bg-sky-500/15' },
          { label: 'Balance', value: formatCurrency(stats.balance), sub: stats.overpaid > 0 ? `₹${stats.overpaid.toFixed(0)} advance` : 'remaining', icon: Clock, color: stats.balance > 0 ? 'text-amber-400' : 'text-emerald-400', bg: stats.balance > 0 ? 'bg-amber-500/15' : 'bg-emerald-500/15' },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
                <p className={`text-xl md:text-2xl font-bold tabular-nums ${color}`}>{value}</p>
                <p className="text-xs text-slate-600 mt-1">{sub}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={16} className={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment form — admin only */}
        {isAdmin && <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Record Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update the payment received for {getMonthShort(selectedMonth)}</p>
          </div>
          <form onSubmit={handleSavePayment} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payForm.amountPaid}
                  onChange={e => { setPayForm(f => ({ ...f, amountPaid: e.target.value })); setSaved(false); }}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Payment Date</label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  onChange={e => { setPayForm(f => ({ ...f, paymentDate: e.target.value })); setSaved(false); }}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                value={payForm.notes}
                onChange={e => { setPayForm(f => ({ ...f, notes: e.target.value })); setSaved(false); }}
                rows={2}
                className={inputCls + ' resize-none placeholder:text-slate-600'}
                placeholder="e.g. Paid via UPI, partial instalment..."
              />
            </div>
            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
            >
              {saved ? '✓ Saved' : 'Save Payment'}
            </button>
          </form>
        </div>}

        {/* Confirmed entries list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Confirmed Work Days</h2>
            <p className="text-xs text-slate-500 mt-0.5">{stats.daysWorked} days × {formatCurrency(stats.dailyRate)}</p>
          </div>
          {stats.confirmedEntries.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-slate-600 text-sm">No confirmed days for this month.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
              {stats.confirmedEntries.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="text-xs text-slate-600 font-mono mt-0.5 shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${TYPE_PILL[entry.workType] || 'text-slate-400'}`}>{entry.workType}</span>
                      <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5 truncate">{entry.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-500 tabular-nums shrink-0">{formatCurrency(stats.dailyRate)}</span>
                </div>
              ))}
            </div>
          )}
          {stats.daysWorked > 0 && (
            <div className="px-5 py-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">{stats.daysWorked} days total</span>
              <span className="text-sm font-bold text-brand-400 tabular-nums">{formatCurrency(stats.amountDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* All months overview table */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">All Months Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Month</th>
                <th className="text-right px-4 py-3 font-medium">Days</th>
                <th className="text-right px-4 py-3 font-medium">Amount Due</th>
                <th className="text-right px-4 py-3 font-medium">Amount Paid</th>
                <th className="text-right px-4 py-3 font-medium">Balance</th>
                <th className="text-right px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allMonthKeys.map(mk => {
                const s = calculateMonthStats(entries, payments, mk, settings);
                const isSelected = mk === selectedMonth;
                return (
                  <tr
                    key={mk}
                    onClick={() => handleMonthChange(mk)}
                    className={`cursor-pointer transition-colors hover:bg-slate-800/50 ${isSelected ? 'bg-brand-500/5' : ''}`}
                  >
                    <td className="px-5 py-3 font-medium text-slate-200">
                      {getMonthLabel(mk)}
                      {isSelected && <span className="ml-2 text-[10px] text-brand-500 font-semibold">SELECTED</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{s.daysWorked}</td>
                    <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{formatCurrency(s.amountDue)}</td>
                    <td className="px-4 py-3 text-right text-slate-300 tabular-nums">{formatCurrency(s.amountPaid)}</td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${s.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {s.paymentStatus === 'No Work' ? '—' : formatCurrency(s.balance)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${PAYMENT_STATUS_STYLE[s.paymentStatus]}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Download, ChevronDown, CheckCircle2, X, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  formatCurrency, formatDate,
  getCurrentMonthKey, getMonthLabel,
  getAllMonthKeys,
} from '../utils/helpers';

/* ── Toast ─────────────────────────────────────────────────────── */
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

/* ── Delete confirm dialog ─────────────────────────────────────── */
function DeletePaymentDialog({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-slide-up">
        <h3 className="text-base font-semibold text-slate-100 mb-2">Delete Payment?</h3>
        <p className="text-sm text-slate-400 mb-6">This payment record will be permanently removed. This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Date range for a given month (min = 1st of month, max = min(last day, today)) */
function getDateRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = `${monthKey}-01`;
  const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return { min: firstDay, max: lastDay < today ? lastDay : today };
}

const EMPTY_FORM = { amountPaid: '', paymentDate: '', notes: '' };

/* ── Main component ─────────────────────────────────────────────── */
export default function MonthlySummary() {
  const { entries, payments, settings, addPayment, deletePayment } = useApp();
  const { isAdmin } = useAuth();

  const allMonthKeys = getAllMonthKeys(entries);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [payForm, setPayForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // null | 'saved' | 'deleted'
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleMonthChange = (mk) => {
    setSelectedMonth(mk);
    setPayForm(EMPTY_FORM);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    await addPayment(selectedMonth, {
      amountPaid:  Number(payForm.amountPaid) || 0,
      paymentDate: payForm.paymentDate,
      notes:       payForm.notes,
    });
    setSaving(false);
    setPayForm(EMPTY_FORM);
    setToast('saved');
  };

  const closeToast = useCallback(() => setToast(false), []);

  const handleDeleteConfirm = () => {
    if (deleteTargetId) deletePayment(deleteTargetId);
    setDeleteTargetId(null);
    setToast('deleted');
  };

  // All payment rows sorted newest first
  const paymentRows = [...(payments || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const handleExportCSV = () => {
    const headers = isAdmin
      ? ['Month', 'Date of Payment', 'Amount (₹)', 'Notes']
      : ['Date of Payment', 'Amount (₹)', 'Notes'];
    const rows = paymentRows.map(p => {
      const base = [
        p.paymentDate ? formatDate(p.paymentDate) : '—',
        p.amountPaid > 0 ? p.amountPaid.toFixed(2) : '0',
        p.notes || '',
      ];
      return isAdmin ? [getMonthLabel(p.monthKey), ...base] : base;
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `payment-summary-${new Date().toISOString().slice(0, 10)}.csv`,
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors';
  const labelCls = 'block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5';
  const dateRange = getDateRange(selectedMonth);

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-3xl mx-auto">
      {toast && (
        <Toast
          message={toast === 'deleted' ? 'Payment successfully deleted' : 'Payment successfully recorded'}
          onClose={closeToast}
        />
      )}
      {deleteTargetId && (
        <DeletePaymentDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Monthly Pay Summary</h1>
          <p className="text-sm text-slate-500 mt-1">Payment history</p>
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

      {/* Record Payment — admin only */}
      {isAdmin && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl mb-6">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200">Record Payment</h2>
            <p className="text-xs text-slate-500 mt-0.5">Log a payment made to the freelancer</p>
          </div>
          <form onSubmit={handleSavePayment} className="p-5 space-y-4">
            {/* Month selector */}
            <div>
              <label className={labelCls}>Month</label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={e => handleMonthChange(e.target.value)}
                  className={inputCls + ' appearance-none pr-8 cursor-pointer'}
                >
                  {allMonthKeys.map(mk => (
                    <option key={mk} value={mk}>{getMonthLabel(mk)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Amount Paid (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payForm.amountPaid}
                  onChange={e => setPayForm(f => ({ ...f, amountPaid: e.target.value }))}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Date of Payment</label>
                <input
                  type="date"
                  value={payForm.paymentDate}
                  min={dateRange.min}
                  max={dateRange.max}
                  onChange={e => setPayForm(f => ({ ...f, paymentDate: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Notes</label>
              <textarea
                value={payForm.notes}
                onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                className={inputCls + ' resize-none placeholder:text-slate-600'}
                placeholder="e.g. Paid via UPI, partial instalment..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : 'Save Payment'}
            </button>
          </form>
        </div>
      )}

      {/* All Months Overview table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">All Months Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {paymentRows.length === 0
              ? 'No payments recorded yet'
              : `${paymentRows.length} payment${paymentRows.length === 1 ? '' : 's'} recorded`}
          </p>
        </div>

        {paymentRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-slate-600 text-sm">No payments have been recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  {isAdmin && <th className="text-left px-5 py-3 font-medium">Month</th>}
                  <th className="text-left px-5 py-3 font-medium">Date of Payment</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 font-medium">Notes</th>
                  {isAdmin && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paymentRows.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-slate-300 font-medium whitespace-nowrap">
                        {getMonthLabel(p.monthKey)}
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                      {p.paymentDate ? formatDate(p.paymentDate) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-emerald-400 whitespace-nowrap">
                      {p.amountPaid > 0 ? formatCurrency(p.amountPaid) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {p.notes || <span className="text-slate-600">—</span>}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteTargetId(p.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

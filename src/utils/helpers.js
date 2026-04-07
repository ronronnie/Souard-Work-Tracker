/* ── Currency & Number Formatting ── */

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount ?? 0);
};

export const formatCurrencyWhole = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);
};

/* ── Date Formatting ── */

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
};

/* ── Month Helpers ── */

export const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthKey = (dateStr) => (dateStr || '').slice(0, 7);

export const getMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
};

export const getMonthShort = (monthKey) => {
  if (!monthKey) return '';
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
    month: 'short', year: '2-digit',
  });
};

export const prevMonth = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const nextMonth = (monthKey) => {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/* ── Calculations ── */

export const getDailyRate = (monthlyRemuneration, workingDaysBasis) =>
  (monthlyRemuneration || 25000) / (workingDaysBasis || 31);

export const calculateMonthStats = (entries, payments, monthKey, settings) => {
  const dailyRate = getDailyRate(settings.monthlyRemuneration, settings.workingDaysBasis);
  const monthEntries = entries.filter(e => getMonthKey(e.date) === monthKey);
  const confirmedEntries = monthEntries.filter(e => e.status === 'Approved' || e.status === 'Confirmed');
  const pendingEntries = monthEntries.filter(e => e.status === 'Pending' || e.status === 'Pending Confirmation');
  const daysWorked = confirmedEntries.length;
  const amountDue = daysWorked * dailyRate;
  const payment = payments[monthKey] || {};
  const amountPaid = Number(payment.amountPaid) || 0;
  const rawBalance = amountDue - amountPaid;

  let paymentStatus = 'Pending';
  if (daysWorked === 0) paymentStatus = 'No Work';
  else if (rawBalance <= 0) paymentStatus = 'Paid';
  else if (amountPaid > 0) paymentStatus = 'Partial';

  return {
    monthKey,
    daysWorked,
    pendingDays: pendingEntries.length,
    amountDue,
    amountPaid,
    balance: Math.max(0, rawBalance),
    overpaid: rawBalance < 0 ? Math.abs(rawBalance) : 0,
    paymentStatus,
    paymentDate: payment.paymentDate || '',
    notes: payment.notes || '',
    dailyRate,
    confirmedEntries,
    pendingEntries,
    allEntries: monthEntries,
  };
};

export const getAllMonthKeys = (entries) => {
  const keys = new Set(entries.map(e => getMonthKey(e.date)).filter(Boolean));
  const currentKey = getCurrentMonthKey();
  keys.add(currentKey);
  return [...keys].sort((a, b) => b.localeCompare(a)); // newest first
};

/* ── CSV Export ── */

export const exportEntriesToCSV = (entries) => {
  const headers = ['Date', 'Logged By', 'Work Type', 'Description', 'Status', 'Confirmed By', 'Confirmed At'];
  const rows = entries.map(e => [
    e.date,
    e.loggedBy,
    e.workType,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.status,
    e.confirmedBy || '',
    e.confirmedAt ? e.confirmedAt.slice(0, 10) : '',
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `work-log-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
};

export const exportSummaryToCSV = (rows) => {
  const headers = ['Month', 'Days Worked', 'Daily Rate (₹)', 'Amount Due (₹)', 'Amount Paid (₹)', 'Balance (₹)', 'Payment Status', 'Payment Date', 'Notes'];
  const csvRows = rows.map(r => [
    r.monthLabel,
    r.daysWorked,
    r.dailyRate.toFixed(4),
    r.amountDue.toFixed(2),
    r.amountPaid.toFixed(2),
    r.balance.toFixed(2),
    r.paymentStatus,
    r.paymentDate || '',
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `monthly-summary-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
};

const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

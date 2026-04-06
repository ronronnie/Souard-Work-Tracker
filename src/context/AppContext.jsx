import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'souardjj_worktracker_v1';

const defaultSettings = {
  freelancerName: 'Rahul Sharma',
  monthlyRemuneration: 25000,
  workingDaysBasis: 31,
  ownerNames: ['Ronnie', 'Brother'],
  projectName: 'Souard JJ',
};

const sampleEntries = [
  {
    id: 'e001', date: '2026-02-03', loggedBy: 'Ronnie', workType: 'Photography',
    description: 'Brand identity shoot — product lineup & hero shots for campaign',
    status: 'Confirmed', confirmedBy: 'Ronnie', confirmedAt: '2026-02-03T18:00:00.000Z',
    createdAt: '2026-02-03T10:00:00.000Z',
  },
  {
    id: 'e002', date: '2026-02-08', loggedBy: 'Freelancer', workType: 'Videography',
    description: 'Promo video shoot — 30s & 60s cuts for Instagram Reels',
    status: 'Confirmed', confirmedBy: 'Ronnie', confirmedAt: '2026-02-09T10:00:00.000Z',
    createdAt: '2026-02-08T09:00:00.000Z',
  },
  {
    id: 'e003', date: '2026-02-12', loggedBy: 'Brother', workType: 'Both',
    description: 'Full campaign day — photos + video for summer launch',
    status: 'Confirmed', confirmedBy: 'Brother', confirmedAt: '2026-02-12T20:00:00.000Z',
    createdAt: '2026-02-12T08:00:00.000Z',
  },
  {
    id: 'e004', date: '2026-02-19', loggedBy: 'Freelancer', workType: 'Photography',
    description: 'Product detail shots — flat lays, close-ups & texture shots',
    status: 'Confirmed', confirmedBy: 'Brother', confirmedAt: '2026-02-20T09:30:00.000Z',
    createdAt: '2026-02-19T11:00:00.000Z',
  },
  {
    id: 'e005', date: '2026-02-24', loggedBy: 'Freelancer', workType: 'Editing',
    description: 'Post-production: colour grading & editing for all Feb shoots',
    status: 'Confirmed', confirmedBy: 'Ronnie', confirmedAt: '2026-02-25T11:00:00.000Z',
    createdAt: '2026-02-24T13:00:00.000Z',
  },
  {
    id: 'e006', date: '2026-03-03', loggedBy: 'Ronnie', workType: 'Photography',
    description: 'Event coverage — brand activation at Bandra venue',
    status: 'Confirmed', confirmedBy: 'Ronnie', confirmedAt: '2026-03-04T08:00:00.000Z',
    createdAt: '2026-03-03T17:00:00.000Z',
  },
  {
    id: 'e007', date: '2026-03-10', loggedBy: 'Freelancer', workType: 'Videography',
    description: 'Social media content day — reels and stories batch (6 concepts)',
    status: 'Confirmed', confirmedBy: 'Ronnie', confirmedAt: '2026-03-11T12:00:00.000Z',
    createdAt: '2026-03-10T09:00:00.000Z',
  },
  {
    id: 'e008', date: '2026-03-15', loggedBy: 'Brother', workType: 'Both',
    description: 'Campaign Day 2 — outdoor & lifestyle editorial shoot',
    status: 'Confirmed', confirmedBy: 'Brother', confirmedAt: '2026-03-16T10:00:00.000Z',
    createdAt: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 'e009', date: '2026-03-20', loggedBy: 'Freelancer', workType: 'Photography',
    description: 'Studio shoot — new product line preview for April drop',
    status: 'Pending Confirmation', confirmedBy: null, confirmedAt: null,
    createdAt: '2026-03-20T16:00:00.000Z',
  },
  {
    id: 'e010', date: '2026-03-25', loggedBy: 'Freelancer', workType: 'Editing',
    description: 'Video editing — full post-production for March batch',
    status: 'Pending Confirmation', confirmedBy: null, confirmedAt: null,
    createdAt: '2026-03-25T14:00:00.000Z',
  },
  {
    id: 'e011', date: '2026-03-28', loggedBy: 'Freelancer', workType: 'Travel Day',
    description: 'Location scouting — drove to 3 outdoor spots for April campaign',
    status: 'Cancelled', confirmedBy: null, confirmedAt: null,
    createdAt: '2026-03-28T18:00:00.000Z',
  },
  {
    id: 'e012', date: '2026-04-01', loggedBy: 'Ronnie', workType: 'Photography',
    description: 'April campaign kickoff — collection reveal shoot',
    status: 'Confirmed', confirmedBy: 'Ronnie', confirmedAt: '2026-04-01T21:00:00.000Z',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'e013', date: '2026-04-03', loggedBy: 'Freelancer', workType: 'Videography',
    description: 'Reel shoot — 3 creative concepts for April social calendar',
    status: 'Pending Confirmation', confirmedBy: null, confirmedAt: null,
    createdAt: '2026-04-03T18:00:00.000Z',
  },
  {
    id: 'e014', date: '2026-04-05', loggedBy: 'Brother', workType: 'Both',
    description: 'BTS content day — behind-the-scenes for campaign launch week',
    status: 'Pending Confirmation', confirmedBy: null, confirmedAt: null,
    createdAt: '2026-04-05T20:00:00.000Z',
  },
];

const samplePayments = {
  '2026-02': { amountPaid: 3000, paymentDate: '2026-03-05', notes: 'First instalment — rest pending' },
  '2026-03': { amountPaid: 2000, paymentDate: '2026-04-02', notes: 'Partial payment via UPI' },
};

const getInitialData = () => ({
  settings: defaultSettings,
  entries: sampleEntries,
  payments: samplePayments,
});

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return getInitialData();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save to localStorage:', err);
    }
  }, [state]);

  const addEntry = useCallback((entry) => {
    setState(s => ({
      ...s,
      entries: [
        { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
        ...s.entries,
      ],
    }));
  }, []);

  const updateEntry = useCallback((id, updates) => {
    setState(s => ({
      ...s,
      entries: s.entries.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const deleteEntry = useCallback((id) => {
    setState(s => ({ ...s, entries: s.entries.filter(e => e.id !== id) }));
  }, []);

  const confirmEntry = useCallback((id, confirmedBy) => {
    setState(s => ({
      ...s,
      entries: s.entries.map(e =>
        e.id === id
          ? { ...e, status: 'Confirmed', confirmedBy, confirmedAt: new Date().toISOString() }
          : e
      ),
    }));
  }, []);

  const rejectEntry = useCallback((id) => {
    setState(s => ({
      ...s,
      entries: s.entries.map(e =>
        e.id === id
          ? { ...e, status: 'Cancelled', confirmedBy: null, confirmedAt: null }
          : e
      ),
    }));
  }, []);

  const updatePayment = useCallback((monthKey, paymentData) => {
    setState(s => ({
      ...s,
      payments: { ...s.payments, [monthKey]: paymentData },
    }));
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setState(s => ({ ...s, settings: { ...s.settings, ...newSettings } }));
  }, []);

  const exportData = useCallback(() => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worktracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.settings || !Array.isArray(data.entries)) return false;
      setState(data);
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetData = useCallback(() => {
    setState(getInitialData());
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      addEntry,
      updateEntry,
      deleteEntry,
      confirmEntry,
      rejectEntry,
      updatePayment,
      updateSettings,
      exportData,
      importData,
      resetData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

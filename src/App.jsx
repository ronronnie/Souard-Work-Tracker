import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WorkLog from './components/WorkLog';
import ConfirmationFlow from './components/ConfirmationFlow';
import MonthlySummary from './components/MonthlySummary';
import Settings from './components/Settings';

function AppShell() {
  const [view, setView] = useState('dashboard');

  const views = {
    dashboard: <Dashboard onNavigate={setView} />,
    worklog: <WorkLog />,
    confirmations: <ConfirmationFlow />,
    summary: <MonthlySummary />,
    settings: <Settings />,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="animate-fade-in">
          {views[view] || views.dashboard}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

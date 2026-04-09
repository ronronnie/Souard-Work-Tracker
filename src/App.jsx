import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider, useApp } from './context/AppContext'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import WorkLog from './components/WorkLog'
import ConfirmationFlow from './components/ConfirmationFlow'
import MonthlySummary from './components/MonthlySummary'
import Settings from './components/Settings'

function AppShell() {
  const [view, setView] = useState('dashboard')
  const { auth } = useAuth()
  const { loading, error } = useApp()

  // Gate: not logged in → show login page
  if (!auth) return <LoginPage />

  const views = {
    dashboard:     <Dashboard onNavigate={setView} />,
    worklog:       <WorkLog />,
    confirmations: <ConfirmationFlow />,
    summary:       <MonthlySummary />,
    settings:      <Settings />,
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 gap-3">
      <div className="w-5 h-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm">Connecting to database…</p>
    </div>
  )

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 rounded-full bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
          <span className="text-brand-400 text-xl">!</span>
        </div>
        <h2 className="text-slate-100 font-semibold mb-2">Could not connect to Supabase</h2>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <p className="text-slate-600 text-xs">
          Make sure your <code className="text-brand-400">.env.local</code> file has the correct
          <code className="text-brand-400"> VITE_SUPABASE_URL</code> and
          <code className="text-brand-400"> VITE_SUPABASE_ANON_KEY</code> values.
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar currentView={view} onNavigate={setView} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="animate-fade-in">
          {views[view] || views.dashboard}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </AuthProvider>
  )
}

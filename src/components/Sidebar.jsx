import { LayoutDashboard, ClipboardList, CheckSquare, BarChart3, Settings, Camera, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const ADMIN_NAV = [
  { id: 'dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'worklog',       label: 'Work Log',        icon: ClipboardList   },
  { id: 'confirmations', label: 'Confirmations',   icon: CheckSquare     },
  { id: 'summary',       label: 'Monthly Summary', icon: BarChart3       },
  { id: 'settings',      label: 'Settings',        icon: Settings        },
]

const FREELANCER_NAV = [
  { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'worklog',   label: 'Work Log',        icon: ClipboardList   },
  { id: 'summary',   label: 'Monthly Summary', icon: BarChart3       },
  { id: 'settings',  label: 'Settings',        icon: Settings        },
]

export default function Sidebar({ currentView, onNavigate }) {
  const { entries, settings } = useApp()
  const { isAdmin, isFreelancer, username, logout } = useAuth()

  const pendingCount = entries.filter(e => e.status === 'Pending Confirmation').length
  const NAV = isAdmin ? ADMIN_NAV : FREELANCER_NAV

  // Bottom user info
  const displayName  = isAdmin ? username : settings.freelancerName
  const displayRole  = isAdmin ? 'Admin' : 'Freelancer'
  const displayInitial = displayName?.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-slate-900 border-r border-slate-800 h-screen">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
            <Camera size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
              {settings.projectName}
            </p>
            <p className="text-xs text-slate-500 truncate leading-tight mt-0.5">Work Tracker</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = currentView === id
            const badge  = id === 'confirmations' && pendingCount > 0 ? pendingCount : null
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-100 text-left group
                  ${active
                    ? 'bg-brand-500/15 text-brand-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }
                `}
              >
                <Icon size={17} className={active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="flex-1 truncate">{label}</span>
                {badge && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold flex items-center justify-center tabular-nums">
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
              {displayInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-300 truncate">{displayName}</p>
              <p className="text-xs text-slate-600 truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
          >
            <LogOut size={13} />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 flex">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = currentView === id
          const badge  = id === 'confirmations' && pendingCount > 0 ? pendingCount : null
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`
                flex-1 flex flex-col items-center gap-1 py-2.5 px-1 relative
                transition-colors duration-100
                ${active ? 'text-brand-400' : 'text-slate-500'}
              `}
            >
              <div className="relative">
                <Icon size={20} />
                {badge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none truncate w-full text-center">
                {id === 'confirmations' ? 'Approve' : id === 'summary' ? 'Summary' : label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

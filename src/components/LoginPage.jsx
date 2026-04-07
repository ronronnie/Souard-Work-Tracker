import { useState } from 'react'
import { Eye, EyeOff, Camera, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    setError('')
    const result = await login(username.trim(), password)
    setLoading(false)
    if (!result.success) setError(result.error)
  }

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 ' +
    'placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 ' +
    'focus:ring-brand-500/30 transition-colors'

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/25">
            <Camera size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Souard JJ</h1>
          <p className="text-sm text-slate-500 mt-1">Work Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-slate-200 mb-5">Sign in to continue</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                className={inputCls}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  className={inputCls + ' pr-11'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2.5">
                <span className="text-brand-400 text-sm">⚠</span>
                <p className="text-sm text-brand-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={15} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Souard JJ · Private Work Tracker
        </p>
      </div>
    </div>
  )
}

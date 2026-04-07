import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── Default settings (used as fallback before DB loads) ──────────
const defaultSettings = {
  freelancerName:      'Rahul Sharma',
  monthlyRemuneration: 25000,
  workingDaysBasis:    31,
  ownerNames:          ['Ronnie', 'Brother'],
  projectName:         'Souard JJ',
}

// ── Row → app-format transforms ──────────────────────────────────
const toEntry = (r) => ({
  id:          r.id,
  date:        r.date,
  loggedBy:    r.logged_by,
  workType:    r.work_type,
  description: r.description ?? '',
  status:      r.status,
  confirmedBy: r.confirmed_by  ?? null,
  confirmedAt: r.confirmed_at  ?? null,
  createdAt:   r.created_at,
})

const toSettings = (r) => r ? {
  freelancerName:      r.freelancer_name,
  monthlyRemuneration: Number(r.monthly_remuneration),
  workingDaysBasis:    Number(r.working_days_basis),
  ownerNames:          r.owner_names ?? ['Ronnie', 'Brother'],
  projectName:         r.project_name,
} : defaultSettings

const toPaymentsMap = (rows) => {
  const map = {}
  ;(rows ?? []).forEach(r => {
    map[r.month_key] = {
      amountPaid:  Number(r.amount_paid) || 0,
      paymentDate: r.payment_date ?? '',
      notes:       r.notes ?? '',
    }
  })
  return map
}

// ── Context ───────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [entries,  setEntries]  = useState([])
  const [payments, setPayments] = useState({})
  const [settings, setSettings] = useState(defaultSettings)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // ── Fetch all data from Supabase ────────────────────────────────
  const fetchAll = useCallback(async () => {
    setError(null)
    try {
      const [
        { data: eData, error: eErr },
        { data: pData, error: pErr },
        { data: sData, error: sErr },
      ] = await Promise.all([
        supabase.from('entries').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('payments').select('*'),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ])
      if (eErr) throw eErr
      if (pErr) throw pErr
      if (sErr) throw sErr
      setEntries((eData ?? []).map(toEntry))
      setPayments(toPaymentsMap(pData))
      setSettings(toSettings(sData))
    } catch (err) {
      setError(err?.message ?? 'Failed to load data from Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Mount: initial fetch + real-time subscriptions ──────────────
  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('db-changes')
      // entries: live updates so all 3 users see each other's changes instantly
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'entries' },
        ({ new: row }) => setEntries(prev => [toEntry(row), ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'entries' },
        ({ new: row }) => setEntries(prev => prev.map(e => e.id === row.id ? toEntry(row) : e)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'entries' },
        ({ old: row }) => setEntries(prev => prev.filter(e => e.id !== row.id)))
      // payments + settings: just refetch on any change (simpler)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments'  }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings'  }, fetchAll)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  // ── Mutations ───────────────────────────────────────────────────

  const addEntry = useCallback(async (entry) => {
    const { error } = await supabase.from('entries').insert({
      date:        entry.date,
      logged_by:   entry.loggedBy,
      work_type:   entry.workType,
      description: entry.description,
      status:      entry.status,
    })
    if (error) throw error
    // real-time INSERT event will add it to state automatically
  }, [])

  const updateEntry = useCallback(async (id, updates) => {
    // Optimistic update
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    const { error } = await supabase.from('entries').update({
      date:        updates.date,
      logged_by:   updates.loggedBy,
      work_type:   updates.workType,
      description: updates.description,
      status:      updates.status,
      confirmed_by:  updates.confirmedBy  ?? null,
      confirmed_at:  updates.confirmedAt  ?? null,
    }).eq('id', id)
    if (error) { fetchAll(); throw error }
  }, [fetchAll])

  const deleteEntry = useCallback(async (id) => {
    // Optimistic update
    setEntries(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('entries').delete().eq('id', id)
    if (error) { fetchAll(); throw error }
  }, [fetchAll])

  const confirmEntry = useCallback(async (id, confirmedBy) => {
    const now = new Date().toISOString()
    // Optimistic update
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'Approved', confirmedBy, confirmedAt: now } : e
    ))
    const { error } = await supabase.from('entries').update({
      status:       'Approved',
      confirmed_by: confirmedBy,
      confirmed_at: now,
    }).eq('id', id)
    if (error) { fetchAll(); throw error }
  }, [fetchAll])

  const rejectEntry = useCallback(async (id) => {
    // Optimistic update
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'Rejected', confirmedBy: null, confirmedAt: null } : e
    ))
    const { error } = await supabase.from('entries').update({
      status:       'Rejected',
      confirmed_by: null,
      confirmed_at: null,
    }).eq('id', id)
    if (error) { fetchAll(); throw error }
  }, [fetchAll])

  const updatePayment = useCallback(async (monthKey, paymentData) => {
    // Optimistic update
    setPayments(prev => ({ ...prev, [monthKey]: paymentData }))
    const { error } = await supabase.from('payments').upsert({
      month_key:    monthKey,
      amount_paid:  Number(paymentData.amountPaid) || 0,
      payment_date: paymentData.paymentDate || null,
      notes:        paymentData.notes || '',
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'month_key' })
    if (error) { fetchAll(); throw error }
  }, [fetchAll])

  const updateSettings = useCallback(async (newSettings) => {
    // Optimistic update
    setSettings(s => ({ ...s, ...newSettings }))
    const { error } = await supabase.from('settings').upsert({
      id:                    1,
      freelancer_name:       newSettings.freelancerName,
      monthly_remuneration:  Number(newSettings.monthlyRemuneration),
      working_days_basis:    Number(newSettings.workingDaysBasis),
      owner_names:           newSettings.ownerNames,
      project_name:          newSettings.projectName,
    }, { onConflict: 'id' })
    if (error) { fetchAll(); throw error }
  }, [fetchAll])

  // ── Export / Import JSON ────────────────────────────────────────
  const exportData = useCallback(() => {
    const json = JSON.stringify({ settings, entries, payments }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `worktracker-backup-${new Date().toISOString().slice(0, 10)}.json` })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [settings, entries, payments])

  const importData = useCallback(async (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr)
      if (!data.settings || !Array.isArray(data.entries)) return false

      // Bulk insert entries
      if (data.entries.length > 0) {
        const rows = data.entries.map(e => ({
          id:          e.id,
          date:        e.date,
          logged_by:   e.loggedBy,
          work_type:   e.workType,
          description: e.description,
          status:      e.status,
          confirmed_by: e.confirmedBy ?? null,
          confirmed_at: e.confirmedAt ?? null,
          created_at:   e.createdAt,
        }))
        const { error } = await supabase.from('entries').upsert(rows, { onConflict: 'id' })
        if (error) throw error
      }

      // Upsert payments
      const paymentRows = Object.entries(data.payments ?? {}).map(([month_key, p]) => ({
        month_key,
        amount_paid:  p.amountPaid,
        payment_date: p.paymentDate || null,
        notes:        p.notes,
      }))
      if (paymentRows.length > 0) {
        const { error } = await supabase.from('payments').upsert(paymentRows, { onConflict: 'month_key' })
        if (error) throw error
      }

      // Upsert settings
      await updateSettings(data.settings)

      await fetchAll()
      return true
    } catch (err) {
      console.error('Import failed:', err)
      return false
    }
  }, [fetchAll, updateSettings])

  const resetData = useCallback(async () => {
    await Promise.all([
      supabase.from('entries').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('payments').delete().neq('month_key', ''),
    ])
    await fetchAll()
  }, [fetchAll])

  return (
    <AppContext.Provider value={{
      entries, payments, settings, loading, error,
      addEntry, updateEntry, deleteEntry,
      confirmEntry, rejectEntry,
      updatePayment, updateSettings,
      exportData, importData, resetData,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

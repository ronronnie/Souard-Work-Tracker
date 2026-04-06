import { useState, useRef } from 'react';
import { Save, Download, Upload, RotateCcw, Plus, X, IndianRupee } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getDailyRate, formatCurrency } from '../utils/helpers';

function Section({ title, description, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, exportData, importData, resetData } = useApp();

  const [form, setForm] = useState({ ...settings, ownerNames: [...settings.ownerNames] });
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const importRef = useRef(null);

  const dailyRate = getDailyRate(form.monthlyRemuneration, form.workingDaysBasis);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.projectName.trim() || !form.freelancerName.trim()) return;
    updateSettings({
      ...form,
      monthlyRemuneration: Number(form.monthlyRemuneration),
      workingDaysBasis: Number(form.workingDaysBasis),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addOwner = () => {
    if (form.ownerNames.length < 4) {
      setForm(f => ({ ...f, ownerNames: [...f.ownerNames, ''] }));
    }
  };

  const removeOwner = (i) => {
    setForm(f => ({ ...f, ownerNames: f.ownerNames.filter((_, idx) => idx !== i) }));
  };

  const setOwner = (i, v) => {
    setForm(f => {
      const names = [...f.ownerNames];
      names[i] = v;
      return { ...f, ownerNames: names };
    });
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      if (ok) {
        setImportSuccess(true);
        setImportError('');
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError('Invalid file — could not import data.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const inputCls = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-colors placeholder:text-slate-600';
  const labelCls = 'block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your tracker</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Project & People */}
        <Section title="Project & People" description="Names and identities used across the app">
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Project / Brand Name</label>
              <input
                type="text"
                value={form.projectName}
                onChange={e => set('projectName', e.target.value)}
                className={inputCls}
                placeholder="e.g. Souard JJ"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Freelancer Name</label>
              <input
                type="text"
                value={form.freelancerName}
                onChange={e => set('freelancerName', e.target.value)}
                className={inputCls}
                placeholder="Freelancer's full name"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Owner Names</label>
              <div className="space-y-2">
                {form.ownerNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={e => setOwner(i, e.target.value)}
                      className={inputCls}
                      placeholder={`Owner ${i + 1}`}
                    />
                    {form.ownerNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOwner(i)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 border border-slate-700 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {form.ownerNames.length < 4 && (
                  <button
                    type="button"
                    onClick={addOwner}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-400 transition-colors py-1"
                  >
                    <Plus size={13} /> Add owner
                  </button>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Remuneration */}
        <Section title="Remuneration" description="How payment is calculated">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monthly Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.monthlyRemuneration}
                    onChange={e => set('monthlyRemuneration', e.target.value)}
                    className={inputCls + ' pl-7'}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Working Days Basis</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  value={form.workingDaysBasis}
                  onChange={e => set('workingDaysBasis', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Calculated daily rate preview */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                <IndianRupee size={15} className="text-brand-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Calculated daily rate</p>
                <p className="text-base font-bold text-brand-400 tabular-nums">{formatCurrency(dailyRate)}</p>
                <p className="text-xs text-slate-600">₹{form.monthlyRemuneration} ÷ {form.workingDaysBasis} days</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Save button */}
        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          <Save size={16} />
          {saved ? 'Settings Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* Data management */}
      <div className="mt-5 space-y-5">
        <Section title="Data Backup" description="Export or import all your data as a JSON file">
          <div className="space-y-3">
            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-600 hover:bg-slate-800/50 transition-colors"
            >
              <Download size={15} />
              Export JSON Backup
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-300 hover:text-slate-100 hover:border-slate-600 hover:bg-slate-800/50 transition-colors"
            >
              <Upload size={15} />
              Import JSON Backup
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            {importError && (
              <p className="text-xs text-brand-400 bg-brand-500/10 px-3 py-2 rounded-lg">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg">✓ Data imported successfully.</p>
            )}
          </div>
        </Section>

        {/* Danger zone */}
        <div className="bg-slate-900 border border-brand-500/20 rounded-xl">
          <div className="px-5 py-4 border-b border-brand-500/15">
            <h2 className="text-sm font-semibold text-brand-400">Danger Zone</h2>
            <p className="text-xs text-slate-500 mt-0.5">This will erase all work entries and payments</p>
          </div>
          <div className="p-5">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-500/30 text-sm text-brand-400 hover:bg-brand-500/10 transition-colors"
              >
                <RotateCcw size={14} />
                Reset All Data
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-300 bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2.5">
                  Are you sure? This will reset to sample data and <strong className="text-brand-400">cannot be undone</strong>.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { resetData(); setShowResetConfirm(false); }}
                    className="flex-1 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

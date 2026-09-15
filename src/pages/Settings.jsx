import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Shield, Database, LogOut, Moon, Sun, Gauge, Info, Languages } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import RoleBadge from '../components/ui/RoleBadge'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../auth/AuthContext'
import { ROLES } from '../auth/roleConfig'

const DEFAULT_RISK_THRESHOLDS = { moderate: 40, high: 65, critical: 85 }

function initialsFor(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Settings() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, languages } = useLanguage()
  const { user, role, logout } = useAuth()
  const [toggles, setToggles] = useState({
    highRiskAlerts: true,
    weeklyDigest: false,
    routeChanges: true,
  })
  const [riskScoreVisible, setRiskScoreVisible] = useState(true)
  const [thresholds, setThresholds] = useState(DEFAULT_RISK_THRESHOLDS)
  const [thresholdError, setThresholdError] = useState('')
  const [operationalPrefs, setOperationalPrefs] = useState({ showRiskScores: true, compactOperationsTable: false })
  const toggleOperationalPref = (k) => setOperationalPrefs((p) => ({ ...p, [k]: !p[k] }))

  const toggle = (k) => setToggles((p) => ({ ...p, [k]: !p[k] }))

  const updateThreshold = (key, rawValue) => {
    const value = Math.max(1, Math.min(99, Number(rawValue) || 0))
    const next = { ...thresholds, [key]: value }
    if (!(next.moderate < next.high && next.high < next.critical)) {
      setThresholdError('Thresholds must increase from Moderate → High → Critical.')
      return
    }
    setThresholdError('')
    setThresholds(next)
  }

  const resetThresholds = () => {
    setThresholds(DEFAULT_RISK_THRESHOLDS)
    setThresholdError('')
  }

  const handleSignOut = () => {
    logout()
    navigate('/role-select')
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile & Settings</h1>

      <Card className="p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initialsFor(user?.name)}
        </div>
        <div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</div>
          <RoleBadge role={role} className="mt-1.5" />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle icon={Bell} title="Notification Preferences" />
        <div className="space-y-1 mt-4">
          <ToggleRow label="High-risk zone alerts" checked={toggles.highRiskAlerts} onChange={() => toggle('highRiskAlerts')} />
          <ToggleRow label="Weekly summary digest" checked={toggles.weeklyDigest} onChange={() => toggle('weeklyDigest')} />
          <ToggleRow label="Route recommendation changes" checked={toggles.routeChanges} onChange={() => toggle('routeChanges')} />
        </div>
      </Card>

      <Card className="p-6">
        <SectionTitle icon={theme === 'dark' ? Moon : Sun} title="Appearance" />
        <div className="mt-4">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-slate-600 dark:text-slate-300">Dark mode</span>
            <button
              onClick={toggleTheme}
              className={`h-6 w-11 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </Card>

      {(role === ROLES.CITIZEN || role === ROLES.EMERGENCY_COORDINATOR) && (
        <Card className="p-6">
          <SectionTitle icon={Languages} title="Language" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
            {role === ROLES.CITIZEN
              ? 'Choose the language for the Citizen Portal. English is the default; some labels may still appear in English if not yet translated.'
              : 'Choose your preferred interface language. Translation coverage is currently most complete on the Citizen Portal — some Coordinator screens may still appear in English.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  language === l.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {role === ROLES.EMERGENCY_COORDINATOR && (
        <Card className="p-6">
          <SectionTitle icon={Gauge} title="Operational Display Preferences" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-1">Personal display preferences for the Emergency Operations Center console — these do not affect other coordinators or any authoritative data.</p>
          <div className="space-y-1 mt-3">
            <ToggleRow label="Show numeric risk scores" checked={operationalPrefs.showRiskScores} onChange={() => toggleOperationalPref('showRiskScores')} />
            <ToggleRow label="Compact Active Operations table" checked={operationalPrefs.compactOperationsTable} onChange={() => toggleOperationalPref('compactOperationsTable')} />
          </div>
        </Card>
      )}

      {role === ROLES.DISASTER_AUTHORITY && (
        <Card className="p-6">
          <SectionTitle icon={Gauge} title="Risk Score" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
            Configure how habitation risk scores are surfaced and where the Low / Moderate / High / Critical tier boundaries fall. This is frontend
            prototype state only — nothing here is persisted or connected to a trained ML model.
          </p>

          <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 mb-3">
            <div>
              <span className="text-sm text-slate-600 dark:text-slate-300 block">Risk score visibility</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">Show numeric risk scores (not just tier labels) across the app.</span>
            </div>
            <button
              onClick={() => setRiskScoreVisible((v) => !v)}
              className={`h-6 w-11 rounded-full relative transition-colors shrink-0 ${riskScoreVisible ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${riskScoreVisible ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2.5">Risk tier thresholds</div>
          <div className="space-y-3">
            <ThresholdRow label="Low-risk threshold" range={`0 – ${thresholds.moderate - 1}`} tone="good" />
            <ThresholdRow
              label="Moderate-risk threshold"
              range={`${thresholds.moderate} – ${thresholds.high - 1}`}
              tone="warning"
              value={thresholds.moderate}
              onChange={(v) => updateThreshold('moderate', v)}
            />
            <ThresholdRow
              label="High-risk threshold"
              range={`${thresholds.high} – ${thresholds.critical - 1}`}
              tone="danger"
              value={thresholds.high}
              onChange={(v) => updateThreshold('high', v)}
            />
            <ThresholdRow
              label="Critical-risk threshold"
              range={`${thresholds.critical} – 100`}
              tone="danger"
              value={thresholds.critical}
              onChange={(v) => updateThreshold('critical', v)}
            />
          </div>
          {thresholdError && <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-3">{thresholdError}</p>}
          <div className="flex items-center justify-between mt-4">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Info size={12} /> Risk score = Hazard Intensity × 0.40 + Population Vulnerability × 0.25 + Disaster History × 0.20 + Infrastructure Constraint × 0.15
            </p>
            <button onClick={resetThresholds} className="text-xs font-semibold text-blue-600 dark:text-blue-400 shrink-0 ml-3">
              Reset to defaults
            </button>
          </div>
        </Card>
      )}

      {role === ROLES.DISASTER_AUTHORITY && (
        <Card className="p-6">
          <SectionTitle icon={Database} title="Data Sources (System Settings)" />
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">
            This is a frontend prototype for SIH26191. All figures below are simulated / demonstration data
            designed to show how GEOSENTRA would integrate with real hazard, census and infrastructure feeds —
            none of it is a live government or satellite data connection.
          </p>
          <div className="space-y-2.5 text-sm">
            <DataRow label="Risk Model" value="v2.3 (simulated) — updated today" />
            <DataRow label="Population Data" value="Simulated census proxy — demonstration only" />
            <DataRow label="Infrastructure Registry" value="Simulated manual entry (prototype)" />
          </div>
        </Card>
      )}

      <DataStatusPanel />

      <Card className="p-6">
        <SectionTitle icon={Shield} title="Access" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-4">This prototype uses mock frontend authentication for demonstration purposes only — no real accounts or passwords are involved.</p>
        <Button variant="secondary" onClick={handleSignOut}>
          <LogOut size={15} /> Sign out
        </Button>
      </Card>
    </div>
  )
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className="text-blue-600 dark:text-blue-400" />
      <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
    </div>
  )
}

function ToggleRow({ label, checked, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${disabled ? 'opacity-50' : ''}`}>
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <button
        disabled={disabled}
        onClick={onChange}
        className={`h-6 w-11 rounded-full relative transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  )
}

const THRESHOLD_DOT = { good: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500' }

function ThresholdRow({ label, range, tone, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-white/5 px-3.5 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${THRESHOLD_DOT[tone]}`} />
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{label}</div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">Score range {range}</div>
        </div>
      </div>
      {onChange ? (
        <input
          type="number"
          min={1}
          max={99}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100 text-right"
        />
      ) : (
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 shrink-0">Fixed floor</span>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { FlaskConical, RotateCcw, Save, FolderOpen, ArrowRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge, { riskTone } from '../components/ui/Badge'
import DataStatusPanel from '../components/ui/DataStatusPanel'
import { useAppState } from '../state/AppStateContext'
import { computeDashboardMetrics } from '../data/dashboard'
import { DEFAULT_SCENARIO, isDefaultScenario } from '../utils/riskCalculations'
import { routeGeometry } from '../data/routes'
import { rankRoutesForProfile } from '../utils/routeCalculations'

const SLIDERS = [
  { key: 'rainfallIntensity', label: 'Rainfall Intensity', unit: '%', min: 0, max: 100, step: 5, hint: 'Feeds Flood + Cloudburst (+ lightly Landslide)' },
  { key: 'floodDepthDelta', label: 'Flood Depth', unit: ' pts', min: -20, max: 60, step: 5, hint: 'Feeds Flood only' },
  { key: 'landslideSusceptibilityDelta', label: 'Landslide Susceptibility', unit: ' pts', min: -20, max: 60, step: 5, hint: 'Feeds Landslide only' },
  { key: 'coastalErosionRateDelta', label: 'Coastal Erosion Rate', unit: ' pts', min: -20, max: 60, step: 5, hint: 'Feeds Coastal Erosion only' },
  { key: 'cloudburstIntensityDelta', label: 'Cloudburst Intensity', unit: ' pts', min: -20, max: 60, step: 5, hint: 'Feeds Cloudburst only' },
  { key: 'drainageCapacityDelta', label: 'Drainage Capacity', unit: ' pts', min: -50, max: 50, step: 5, hint: 'Negative = worse drainage, raises Flood + Cloudburst' },
  { key: 'roadAccessibilityDelta', label: 'Road Accessibility', unit: ' pts', min: -50, max: 50, step: 5, hint: 'Negative = worse access, raises infrastructure constraint' },
  { key: 'populationVulnerabilityDelta', label: 'Population Vulnerability', unit: ' pts', min: -20, max: 40, step: 5, hint: 'Applied globally to every habitation' },
]

export default function WhatIf() {
  const { habitations, scenario, setScenario, resetScenario, isScenarioDefault, profileId, computeStatusChangeFor } = useAppState()
  const [savedScenario, setSavedScenario] = useState(null)

  const before = useMemo(() => computeDashboardMetrics(DEFAULT_SCENARIO), [])
  const after = useMemo(() => computeDashboardMetrics(scenario), [scenario])

  const changedHabitations = useMemo(() => habitations.map((h) => ({ h, change: computeStatusChangeFor(h) })).filter((x) => x.change.changed), [habitations, computeStatusChangeFor])

  const routesBefore = useMemo(() => rankRoutesForProfile(['A', 'B', 'C'].map((id) => routeGeometry[id]), profileId, DEFAULT_SCENARIO), [profileId])
  const routesAfter = useMemo(() => rankRoutesForProfile(['A', 'B', 'C'].map((id) => routeGeometry[id]), profileId, scenario), [profileId, scenario])
  const routeRankingChanged = routesBefore.map((r) => r.route.id).join(',') !== routesAfter.map((r) => r.route.id).join(',')

  const handleSliderChange = (key, value) => setScenario({ [key]: Number(value) })

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <FlaskConical size={22} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">What-If Simulator</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Adjust hazard conditions and see risk, Red Zone status, relocation priority and route warnings update together.</p>
          </div>
        </div>
        <Badge tone="warning">Simulated scenario output — not a live forecast</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={resetScenario} disabled={isScenarioDefault} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40">
          <RotateCcw size={14} /> Reset scenario
        </button>
        <button onClick={() => setSavedScenario(scenario)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <Save size={14} /> Save scenario
        </button>
        <button onClick={() => savedScenario && setScenario(savedScenario)} disabled={!savedScenario} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40">
          <FolderOpen size={14} /> Load saved scenario
        </button>
        {!isScenarioDefault && <span className="text-xs text-slate-400 dark:text-slate-500">Scenario active — every page reflects this until reset.</span>}
      </div>

      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Scenario Inputs</h3>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
          {SLIDERS.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={s.key} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {s.label}
                </label>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {scenario[s.key] > 0 ? '+' : ''}
                  {scenario[s.key]}
                  {s.unit}
                </span>
              </div>
              <input id={s.key} type="range" min={s.min} max={s.max} step={s.step} value={scenario[s.key]} onChange={(e) => handleSliderChange(s.key, e.target.value)} className="w-full accent-blue-600" />
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s.hint}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Before / after dashboard comparison */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Scenario Summary — Before / After</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2 pr-4 font-semibold">Metric</th>
                <th className="py-2 pr-4 font-semibold">Baseline</th>
                <th className="py-2 pr-4 font-semibold">Current Scenario</th>
                <th className="py-2 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {after.map((m, i) => {
                const b = before[i]
                const delta = m.value - b.value
                return (
                  <tr key={m.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                    <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300">{m.label}</td>
                    <td className="py-2.5 pr-4 text-slate-500 dark:text-slate-400">{b.value.toLocaleString()}</td>
                    <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-slate-100">{m.value.toLocaleString()}</td>
                    <td className={`py-2.5 font-semibold ${delta > 0 ? 'text-red-600 dark:text-red-400' : delta < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toLocaleString()}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Habitation status changes */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Red Zone Status Changes</h3>
        {changedHabitations.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No habitation has crossed a Red Zone threshold under the current scenario.</p>}
        <div className="space-y-2.5">
          {changedHabitations.map(({ h, change }) => (
            <div key={h.id} className="flex items-center gap-3 flex-wrap text-sm">
              <span className="font-semibold text-slate-800 dark:text-slate-200 min-w-[140px]">{h.name}</span>
              <Badge tone={riskTone(change.previousStatus)}>{change.previousStatus}</Badge>
              <ArrowRight size={14} className="text-slate-400" />
              <Badge tone={riskTone(change.currentStatus)}>{change.currentStatus}</Badge>
              <span className="text-slate-400 dark:text-slate-500 text-xs">
                Timeframe now: <b className="text-slate-600 dark:text-slate-300">{change.current.relocationTimeframe}</b>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Route ranking before/after */}
      <Card className="p-6">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">Route Warnings — Default Trip, Current Profile</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">{routeRankingChanged ? 'Route ranking changed under this scenario.' : 'Route ranking is unchanged from baseline.'}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Baseline</div>
            {routesBefore.map(({ route, stats }) => (
              <div key={route.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                <span className="text-slate-600 dark:text-slate-300">{route.name}</span>
                <Badge tone={stats.tag === 'not-recommended' ? 'danger' : stats.tag === 'balanced' ? 'warning' : 'good'}>{stats.label}</Badge>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Current Scenario</div>
            {routesAfter.map(({ route, stats }) => (
              <div key={route.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                <span className="text-slate-600 dark:text-slate-300">{route.name}</span>
                <Badge tone={stats.tag === 'not-recommended' ? 'danger' : stats.tag === 'balanced' ? 'warning' : 'good'}>{stats.label}</Badge>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <DataStatusPanel />
    </div>
  )
}

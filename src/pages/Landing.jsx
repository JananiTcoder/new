import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  ArrowRight,
  PlayCircle,
  Users,
  Target,
  MoveRight,
  RefreshCw,
  ShieldCheck,
  Route,
  Layers,
  GitBranch,
  Sun,
  Moon,
  Menu,
  X,
  MapPinned,
  Radio,
  Building2,
  Phone,
  Mail,
} from 'lucide-react'
import GeoMap from '../components/map/GeoMap'
import { habitations } from '../data/habitations'
import { safeSites } from '../data/safeSites'
import { hazardZones } from '../data/hazards'
import { routeGeometry } from '../data/routes'
import { coordinators } from '../data/coordinators'
import { volunteers } from '../data/volunteers'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Brand from '../components/ui/Brand'
import { useTheme } from '../context/ThemeContext'

const pipeline = [
  { n: '01', title: 'DETECT', desc: 'Identify multi-hazard risk.', icon: Target },
  { n: '02', title: 'UNDERSTAND', desc: 'Understand vulnerable people and infrastructure.', icon: Users },
  { n: '03', title: 'DECIDE', desc: 'Find feasible relocation destinations.', icon: MapPinned },
  { n: '04', title: 'MOVE', desc: 'Generate personalized safe routes.', icon: MoveRight },
  { n: '05', title: 'ADAPT', desc: 'Recalculate when conditions change.', icon: RefreshCw },
]

const integrations = [
  { icon: Layers, title: 'Multi-Hazard Risk', desc: 'Landslide, flood, coastal erosion and cloudburst fused into one score.' },
  { icon: Users, title: 'Vulnerable Population Profiling', desc: 'Elderly, children, disabled residents and healthcare dependency weighted per habitation.' },
  { icon: Route, title: 'Profile-Aware Routing', desc: 'The safest route for a child is not the safest route for a vehicle.' },
  { icon: ShieldCheck, title: 'Capacity & Feasibility', desc: 'Safe destinations checked against water, healthcare, housing and road capacity.' },
  { icon: GitBranch, title: 'Relocation Planning', desc: 'Phased, explainable relocation plans with what-if simulation.' },
  { icon: Compass, title: 'Explainable & Auditable', desc: 'Every recommendation comes with reasons, confidence and a decision trail.' },
]

const navLinks = [
  { id: 'about', label: 'About' },
  { id: 'resources', label: 'Resources' },
  { id: 'support', label: 'Support' },
  { id: 'contact', label: 'Contact' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Real counts from the platform's own data, not fabricated figures — every
  // number here reads from the same data files every dashboard page uses.
  const totalPopulationMonitored = habitations.reduce((sum, h) => sum + h.population, 0)
  const responsePersonnel = coordinators.length + volunteers.length

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Micro identity bar — describes the prototype, never claims to be an
          official government system. */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-medium">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-8 flex items-center justify-between gap-3">
          <span className="truncate">Disaster Management Platform Prototype · Built for Smart India Hackathon 2026</span>
          <span className="hidden sm:inline shrink-0">Frontend demo — no real government backend connected</span>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Brand />

          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Button size="sm" onClick={() => navigate('/role-select')} className="hidden sm:inline-flex">
              Login <ArrowRight size={15} />
            </Button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-3 bg-white dark:bg-slate-950">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="block w-full text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                {l.label}
              </button>
            ))}
            <Button size="sm" className="w-full sm:hidden" onClick={() => navigate('/role-select')}>
              Login <ArrowRight size={15} />
            </Button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 px-5 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 dark:from-slate-900 via-white dark:via-slate-950 to-white dark:to-slate-950" />
        <div className="absolute -top-20 -right-40 -z-10 h-[500px] w-[500px] rounded-full bg-blue-200/40 dark:bg-blue-500/10 blur-3xl" />
        <div className="absolute top-40 -left-40 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-200/30 dark:bg-cyan-500/10 blur-3xl" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Multi-Hazard Intelligence Platform
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-5 text-slate-900 dark:text-slate-100">
              Disaster Management for a Safer India
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mb-9">
              A geospatial intelligence platform that brings together real-time hazard data, coordinated resources
              and disaster preparedness and response planning — helping authorities see the risk, understand the
              people affected, and move them safely.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 mb-10">
              <Button size="lg" onClick={() => navigate('/role-select')}>
                Login <ArrowRight size={18} />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate('/app/routes')}>
                <PlayCircle size={18} /> View Live Demo
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
              <PipelineChip text="HAZARD" />
              <ArrowRight size={14} />
              <PipelineChip text="PEOPLE" />
              <ArrowRight size={14} />
              <PipelineChip text="DECISION" />
              <ArrowRight size={14} />
              <PipelineChip text="SAFE MOVEMENT" />
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-cyan-400/10 blur-xl" />
            <Card className="relative overflow-hidden aspect-[4/3] p-0">
              <GeoMap
                markers={[...habitations.slice(0, 4).map((h) => ({ id: h.id, type: 'habitation', position: h.position, label: h.name, priority: h.priority })), ...safeSites.slice(0, 3).map((s) => ({ id: s.id, type: 'site', position: s.position, label: s.name }))]}
                hazardZones={hazardZones}
                routes={[routeGeometry.A]}
                interactive={false}
              />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="glass-dark text-white text-xs font-semibold px-3 py-1.5 rounded-full">Live Risk Overview</span>
                <span className="glass text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">{hazardZones.length} Active Hazard Zones</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact / statistics — real counts from the platform's own data */}
      <section className="py-14 px-5 lg:px-8 bg-blue-700 dark:bg-blue-950">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <StatTile value={habitations.length} label="Habitations Monitored" />
          <StatTile value={totalPopulationMonitored.toLocaleString()} label="Residents Covered" />
          <StatTile value={safeSites.length} label="Safe Sites Ready" />
          <StatTile value={responsePersonnel} label="Response Personnel" />
        </div>
      </section>

      {/* Pipeline */}
      <section id="resources" className="py-20 px-5 lg:px-8 bg-slate-950 text-white scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">A Complete Decision Pipeline</h3>
            <p className="text-slate-400 max-w-2xl mx-auto">
              GEOSENTRA is more than a hazard map — it is the connective layer between long-term relocation
              planning and split-second evacuation decisions.
            </p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            {pipeline.map((step, i) => (
              <div key={step.n} className="relative animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 h-full hover:bg-white/10 transition-colors">
                  <div className="text-xs font-mono text-blue-400 mb-3">{step.n}</div>
                  <step.icon size={22} className="text-cyan-400 mb-3" strokeWidth={2} />
                  <div className="font-bold mb-1.5">{step.title}</div>
                  <div className="text-sm text-slate-400 leading-snug">{step.desc}</div>
                </div>
                {i < pipeline.length - 1 && (
                  <ArrowRight size={16} className="hidden md:block absolute top-1/2 -right-2.5 -translate-y-1/2 text-slate-600 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / integration story */}
      <section id="about" className="py-20 px-5 lg:px-8 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-3xl font-bold mb-3">The Value Is in the Integration</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Hazard mapping already exists. What GEOSENTRA does differently is connect risk, people,
              destinations and routing into one explainable, auditable system.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((item, i) => (
              <Card key={item.title} hover className="p-6 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                  <item.icon size={20} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">{item.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Entry points */}
      <section className="py-20 px-5 lg:px-8 bg-gradient-to-b from-blue-50/60 dark:from-slate-900/60 to-white dark:to-slate-950">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <Card className="p-8">
            <span className="text-xs font-bold tracking-wide text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1.5">
              <Radio size={13} /> Authority Login
            </span>
            <h4 className="text-2xl font-bold mt-2 mb-3 text-slate-900 dark:text-slate-100">Disaster Authority Intelligence</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              Identify high-risk habitations, evaluate relocation sites, calculate carrying capacity and
              build phased, explainable relocation plans.
            </p>
            <Button variant="secondary" onClick={() => navigate('/role-select')}>
              Authority Login <ArrowRight size={16} />
            </Button>
          </Card>
          <Card className="p-8">
            <span className="text-xs font-bold tracking-wide text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
              <Building2 size={13} /> Resource & Infrastructure Provider
            </span>
            <h4 className="text-2xl font-bold mt-2 mb-3 text-slate-900 dark:text-slate-100">Report Real Capacity Data</h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
              Hospitals, schools, shelters and community halls register separately and submit the capacity data
              that feeds every safe-site recommendation above.
            </p>
            <Button variant="secondary" onClick={() => navigate('/provider/login')}>
              Provider Login <ArrowRight size={16} />
            </Button>
          </Card>
        </div>
      </section>

      <footer id="contact" className="py-12 px-5 lg:px-8 border-t border-slate-100 dark:border-slate-800 scroll-mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <Brand size="sm" className="mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                An intelligent multi-hazard platform for risk assessment, relocation planning and personalized
                emergency navigation. Frontend prototype only.
              </p>
            </div>
            <div id="support">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Support</div>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li>Use the in-app Alerts and Report an Issue pages once logged in.</li>
                <li>Emergency / SOS is available from the Citizen and Volunteer portals.</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">Contact</div>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail size={14} className="shrink-0" /> support@geosentra.demo
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0" /> Demo helpline — not a live number
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 dark:text-slate-500 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Compass size={16} /> GEOSENTRA — Frontend Prototype
            </div>
            <div>Built for Smart India Hackathon 2026</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PipelineChip({ text }) {
  return <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs tracking-wide">{text}</span>
}

function StatTile({ value, label }) {
  return (
    <div>
      <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-blue-200">{label}</div>
    </div>
  )
}

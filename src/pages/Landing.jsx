import { useNavigate } from 'react-router-dom'
import {
  Search,
  ShieldAlert,
  Building2,
  ArrowRight,
  Compass
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden font-sans">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Government Branding */}
            <div className="flex items-center gap-4 pr-6 border-r border-slate-300">
              <div className="flex items-center justify-center shrink-0 w-10">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" alt="Emblem of India" className="h-12 w-auto grayscale contrast-125" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#112a46] text-[15px] leading-tight">Government of India</span>
                <span className="text-[12px] text-slate-600 leading-tight mt-0.5">Ministry of Home Affairs</span>
                <span className="text-[12px] text-slate-600 leading-tight">National Disaster Management Authority</span>
              </div>
            </div>

            {/* GeoSentra Branding */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <Compass size={24} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-[#1a4b85] leading-none tracking-tight">GeoSentra</span>
                <span className="text-[11px] font-medium text-slate-500 leading-tight mt-1">Safer Communities. Stronger Tomorrow.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all"
              />
            </div>
            {/* Login Button */}
            <button
              onClick={() => navigate('/role-select')}
              className="px-6 py-2.5 bg-[#153a6b] hover:bg-[#112a46] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* HERO & STAKEHOLDER CARDS */}
      <section className="relative w-full">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 h-[500px] w-full overflow-hidden">
          <img 
            src="/hero_bg.jpg" 
            alt="Disaster Response" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#0d2a4e]/70 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d2a4e]/90 to-transparent"></div>
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 pt-24 pb-12">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-5 drop-shadow-md">
              Disaster Management<br />for a Safer India
            </h1>
            <p className="text-lg text-blue-50 max-w-lg leading-relaxed mb-8 drop-shadow">
              Integrated geospatial data, real-time information and coordinated resources for better preparedness, response and resilient communities.
            </p>
            {/* Decorative line */}
            <div className="flex gap-1.5 mb-12">
              <div className="h-1 w-6 bg-[#ff9933] rounded-full"></div>
              <div className="h-1 w-6 bg-white rounded-full"></div>
              <div className="h-1 w-6 bg-[#138808] rounded-full"></div>
            </div>
          </div>

          {/* Cards Section */}
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Card 1: Disaster Authority */}
            <div className="bg-[#153a6b] rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl hover:shadow-2xl transition-shadow group border border-[#1a4b85]">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-[#20508c] border border-blue-400/30 flex items-center justify-center shrink-0">
                  <ShieldAlert size={28} className="text-white" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Disaster Authority</h3>
                  <div className="text-blue-200 text-sm mb-1.5">Risk Assessment, Monitoring & Response</div>
                  <p className="text-blue-100 text-sm max-w-[280px] leading-relaxed">Access real-time data, issue alerts, coordinate response and manage disaster operations.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/role-select')}
                className="shrink-0 h-10 w-10 sm:w-auto sm:px-4 rounded-full bg-white text-[#153a6b] text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-blue-50 transition-colors mt-4 sm:mt-0"
              >
                <span className="hidden sm:inline">Access Portal</span> <ArrowRight size={18} />
              </button>
            </div>

            {/* Card 2: Resource Provider */}
            <div className="bg-white rounded-xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl hover:shadow-2xl transition-shadow group border border-slate-200">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-[#e8f5e9] flex items-center justify-center shrink-0">
                  <Building2 size={28} className="text-[#2e7d32]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Resource & Infrastructure Provider</h3>
                  <div className="text-slate-600 text-sm mb-1.5">Shelters, supplies and resource management</div>
                  <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed">Register resources, manage shelters, track availability and support relief operations.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/provider/login')}
                className="shrink-0 h-10 w-10 sm:w-auto sm:px-4 rounded-full bg-[#2e7d32] text-white text-sm font-semibold flex items-center justify-center gap-2 group-hover:bg-[#1b5e20] transition-colors mt-4 sm:mt-0 shadow-sm"
              >
                <span className="hidden sm:inline">Access Portal</span> <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE APP SECTION */}
      <section className="py-20 px-5 lg:px-8 mt-4">
        <div className="max-w-7xl mx-auto rounded-3xl bg-[#f8fbff] shadow-sm border border-blue-50 overflow-hidden">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-10 md:p-12 relative flex justify-center">
               <img src="/mobile_mockup.jpg" alt="GeoSentra Mobile App" className="w-full max-w-sm drop-shadow-2xl rounded-3xl" />
            </div>
            <div className="p-10 md:p-16 md:pl-0 flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">GeoSentra Mobile App</h2>
              <p className="text-xl text-slate-600 mb-5">Safety at your fingertips.</p>
              <p className="text-slate-500 mb-8 max-w-md leading-relaxed text-lg">
                Get real-time alerts, report incidents, find nearby shelters and access emergency resources.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                {/* Simulated Google Play Badge */}
                <button className="h-[52px] px-5 bg-black rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,2C6.477,2,2,6.477,2,12c0,5.523,4.477,10,10,10s10-4.477,10-10C22,6.477,17.523,2,12,2z M15,13H9v-2h6V13z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-zinc-300 leading-none mb-1">GET IT ON</span>
                    <span className="text-sm font-semibold text-white leading-none">Google Play</span>
                  </div>
                </button>
                {/* Simulated App Store Badge */}
                <button className="h-[52px] px-5 bg-black rounded-xl flex items-center gap-3 hover:bg-zinc-800 transition-colors">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.94 5.19A4.38 4.38 0 0 0 16 2a4.34 4.34 0 0 0-3.32 1.7 4.14 4.14 0 0 0-1.09 3.12 4.29 4.29 0 0 0 3.35-1.63zM16.59 7c-2.09 0-3.33 1.25-4.42 1.25-1.07 0-2.31-1.21-4.04-1.21-1.74 0-3.33 1.24-4.28 3-1.8 3.32-.47 8.28 1.26 10.74C5.97 22.06 7.03 23 8.16 23c1.12 0 1.54-.7 3.52-.7s2.34.7 3.53.7c1.17 0 2.1-.88 2.94-2.12a10.82 10.82 0 0 0 1.29-2.73c-2.3-1.02-3.14-3.55-1.92-5.46 1-1.57 2.6-2.58 4.36-2.58-1-1.55-2.67-2.61-4.71-2.61z"/>
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-zinc-300 leading-none mb-1">Download on the</span>
                    <span className="text-sm font-semibold text-white leading-none">App Store</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#112a46] py-7 px-5 lg:px-8 text-sm text-blue-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            <a href="#" className="hover:text-white transition-colors">Help</a>
          </div>
          <div className="font-semibold tracking-widest text-[11px] text-blue-100 uppercase">
            SAFER COMMUNITIES. STRONGER TOMORROW.
          </div>
        </div>
      </footer>
    </div>
  )
}

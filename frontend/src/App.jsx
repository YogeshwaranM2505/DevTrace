import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, BarChart3, Bell, Activity, ChevronRight } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import LogExplorer from './pages/LogExplorer'
import ErrorAnalytics from './pages/ErrorAnalytics'
import AlertCenter from './pages/AlertCenter'
import './index.css'

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/logs',      icon: FileText,        label: 'Log Explorer' },
  { to: '/analytics', icon: BarChart3,       label: 'Error Analytics' },
  { to: '/alerts',    icon: Bell,            label: 'Alert Center' },
]

function Sidebar() {
  const location = useLocation()
  return (
    <aside className="w-56 shrink-0 flex flex-col bg-night-900 border-r border-night-700 min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-night-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-electric-500/20 border border-electric-500/40 flex items-center justify-center">
            <Activity size={14} className="text-electric-400" />
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-slate-100 tracking-tight">DevTrace</span>
            <div className="text-xs text-slate-500 leading-none mt-0.5">Error Analyzer</div>
          </div>
        </div>
      </div>

      {/* Live indicator */}
      <div className="px-5 py-3 border-b border-night-700/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-electric-400 animate-pulse-slow" />
          <span className="text-xs text-electric-400 font-mono">LIVE MONITORING</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-night-700">
        <p className="text-xs text-slate-600 font-mono">v1.0.0 · open-source</p>
      </div>
    </aside>
  )
}

function Topbar() {
  const location = useLocation()
  const page = NAV_ITEMS.find(n => n.to === location.pathname) || NAV_ITEMS[0]
  return (
    <header className="h-12 border-b border-night-700 flex items-center px-6 gap-2 bg-night-900/50 backdrop-blur-sm sticky top-0 z-10">
      <span className="text-slate-500 text-xs font-mono">devtrace</span>
      <ChevronRight size={12} className="text-slate-600" />
      <span className="text-slate-200 text-xs font-mono">{page.label.toLowerCase().replace(' ', '-')}</span>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          {new Date().toLocaleString()}
        </span>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 p-6 animate-fade-in">
            <Routes>
              <Route path="/"          element={<Dashboard />} />
              <Route path="/logs"      element={<LogExplorer />} />
              <Route path="/analytics" element={<ErrorAnalytics />} />
              <Route path="/alerts"    element={<AlertCenter />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

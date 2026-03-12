import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, AlertTriangle, Server, Activity, Zap } from 'lucide-react'
import { logApi, mockDashboard } from '../utils/api'
import { format } from 'date-fns'

const COLORS = ['#ff4d6d', '#f59e0b', '#38bdf8', '#7c3aed', '#00e87a']

const ERROR_COLORS = {
  NullPointerException: '#ff4d6d',
  DatabaseConnectionException: '#f59e0b',
  TimeoutException: '#38bdf8',
  HTTP500Error: '#7c3aed',
  OutOfMemoryError: '#fb923c',
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  const accentClasses = {
    red:   'text-crimson-400 bg-crimson-500/10 border-crimson-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    blue:  'text-ice-400 bg-ice-500/10 border-ice-500/20',
    green: 'text-electric-400 bg-electric-500/10 border-electric-500/20',
  }
  return (
    <div className="stat-card animate-slide-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-100 font-mono">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg border ${accentClasses[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-night-800 border border-night-600 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 font-mono mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-slate-100 font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await logApi.getDashboard()
        setStats(res.data)
      } catch {
        setStats(mockDashboard.data)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-slate-500">
        <Activity size={18} className="animate-spin" />
        <span className="font-mono text-sm">Loading telemetry...</span>
      </div>
    </div>
  )

  const timelineData = stats.timeline.map(p => ({
    time: format(new Date(p.time), 'HH:mm'),
    Errors: p.errorCount,
    Warnings: p.warnCount,
    Info: p.infoCount,
  }))

  const pieData = Object.entries(stats.errorsByService || {}).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-mono">System Overview</h1>
        <p className="text-sm text-slate-500 mt-0.5">Real-time error monitoring · Last 24 hours</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Errors Today" value={stats.totalErrorsToday.toLocaleString()} sub={`${stats.errorRate}% error rate`} accent="red" />
        <StatCard icon={Activity} label="Total Logs" value={stats.totalLogsToday.toLocaleString()} sub="all log levels" accent="blue" />
        <StatCard icon={Zap} label="Active Alerts" value={stats.activeAlerts} sub="require attention" accent="amber" />
        <StatCard icon={Server} label="Services Affected" value={stats.uniqueServicesAffected} sub={`Top: ${stats.mostFrequentError}`} accent="green" />
      </div>

      {/* Timeline Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 font-mono">Error Timeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">Log events per hour</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {[['Errors','#ff4d6d'], ['Warnings','#f59e0b'], ['Info','#38bdf8']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-500 font-mono">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={timelineData}>
            <defs>
              {[['Errors','#ff4d6d'], ['Warnings','#f59e0b'], ['Info','#38bdf8']].map(([key, color]) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={30} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Errors"   stroke="#ff4d6d" fill="url(#grad-Errors)"   strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Warnings" stroke="#f59e0b" fill="url(#grad-Warnings)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Info"     stroke="#38bdf8" fill="url(#grad-Info)"     strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Errors Table */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-200 font-mono mb-4">Top Error Types</h2>
          <div className="space-y-2">
            {stats.topErrors.map((err, i) => {
              const max = stats.topErrors[0].count
              const pct = Math.round((err.count / max) * 100)
              return (
                <div key={err.errorType} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 font-mono w-4">{i + 1}</span>
                      <span className="text-xs font-mono text-slate-200">{err.errorType}</span>
                      <span className="text-xs text-slate-500 hidden group-hover:inline">· {err.mostAffectedService}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-300 font-medium">{err.count.toLocaleString()}</span>
                  </div>
                  <div className="h-1 bg-night-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: ERROR_COLORS[err.errorType] || '#64748b' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Errors by Service Pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-200 font-mono mb-4">Errors by Service</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="50%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={2} stroke="transparent">
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-mono text-slate-400 truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

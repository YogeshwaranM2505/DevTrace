import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { logApi, mockDashboard } from '../utils/api'
import { TrendingUp, Info } from 'lucide-react'

const ERROR_COLORS = {
  NullPointerException:        '#ff4d6d',
  DatabaseConnectionException: '#f59e0b',
  TimeoutException:            '#38bdf8',
  HTTP500Error:                '#7c3aed',
  OutOfMemoryError:            '#fb923c',
  AuthenticationException:     '#06b6d4',
  FileNotFoundException:       '#84cc16',
  StackOverflowError:          '#ec4899',
  UnknownError:                '#64748b',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-night-800 border border-night-600 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-slate-400 font-mono mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-mono text-slate-200">{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

function RootCauseCard({ error }) {
  const color = ERROR_COLORS[error.errorType] || '#64748b'
  return (
    <div className="card border-l-2" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-sm font-semibold text-slate-100">{error.errorType}</span>
            <span className="font-mono text-xs text-slate-500 bg-night-700 px-2 py-0.5 rounded">{error.count.toLocaleString()} occurrences</span>
          </div>
          <div className="flex items-start gap-2 mb-2">
            <Info size={12} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">{error.possibleCause}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-500">Top service: <span className="text-ice-400">{error.mostAffectedService}</span></span>
            {error.lastSeen && <span className="text-slate-500">Last seen: <span className="text-amber-400">{new Date(error.lastSeen).toLocaleTimeString()}</span></span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{error.count}</div>
          <div className="text-xs text-slate-500">errors</div>
        </div>
      </div>
    </div>
  )
}

export default function ErrorAnalytics() {
  const [topErrors, setTopErrors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await logApi.getTopErrors(10)
        setTopErrors(res.data)
      } catch {
        setTopErrors(mockDashboard.data.topErrors)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const barData = topErrors.map(e => ({
    name: e.errorType.replace('Exception', '').replace('Error', ''),
    count: e.count,
    fill: ERROR_COLORS[e.errorType] || '#64748b'
  }))

  const radarData = topErrors.slice(0, 6).map(e => ({
    subject: e.errorType.replace('Exception', '').replace('Error', ''),
    count: e.count,
    fullMark: topErrors[0]?.count || 1
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-sm">
      Loading analytics...
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-mono">Error Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Pattern analysis and root cause identification</p>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-electric-400" />
            <h2 className="text-sm font-semibold text-slate-200 font-mono">Error Frequency</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {barData.map((entry, index) => (
                  <rect key={index} fill={entry.fill} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-slate-200 font-mono mb-4">Error Distribution Radar</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a2035" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              <Radar name="Errors" dataKey="count" stroke="#00e87a" fill="#00e87a" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Root Cause Analysis */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 font-mono mb-3">Root Cause Analysis</h2>
        <div className="space-y-3">
          {topErrors.map(err => <RootCauseCard key={err.errorType} error={err} />)}
        </div>
      </div>
    </div>
  )
}

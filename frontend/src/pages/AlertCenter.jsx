import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle, AlertTriangle, Zap, TrendingUp } from 'lucide-react'
import { logApi, mockAlerts } from '../utils/api'
import { formatDistanceToNow } from 'date-fns'

const SEVERITY_CONFIG = {
  CRITICAL: { bg: 'bg-crimson-500/10', border: 'border-crimson-500/40', text: 'text-crimson-400', icon: '🔴', dot: 'bg-crimson-400' },
  HIGH:     { bg: 'bg-orange-500/10',  border: 'border-orange-500/40',  text: 'text-orange-400',  icon: '🟠', dot: 'bg-orange-400' },
  MEDIUM:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   icon: '🟡', dot: 'bg-amber-400' },
  LOW:      { bg: 'bg-ice-500/10',     border: 'border-ice-500/30',     text: 'text-ice-400',     icon: '🔵', dot: 'bg-ice-400' },
}

function AlertCard({ alert, onResolve }) {
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.LOW
  return (
    <div className={`card border ${cfg.border} ${cfg.bg} animate-slide-in`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dot} block animate-pulse-slow`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${cfg.text} ${cfg.border} ${cfg.bg}`}>
                {alert.severity}
              </span>
              <span className="font-mono text-sm font-semibold text-slate-100">{alert.errorType}</span>
            </div>
            <p className="text-sm text-slate-300 font-mono mb-3 leading-relaxed">{alert.message}</p>

            {/* Stats */}
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={11} className="text-crimson-400" />
                <span className="text-slate-500">Increase: </span>
                <span className="text-crimson-400 font-semibold">+{Math.round(alert.percentageIncrease)}%</span>
              </div>
              <div>
                <span className="text-slate-500">Now: </span>
                <span className="text-slate-200">{alert.currentCount}</span>
                <span className="text-slate-600 mx-1">→</span>
                <span className="text-slate-500">Before: </span>
                <span className="text-slate-400">{alert.previousCount}</span>
              </div>
              {alert.service && (
                <div>
                  <span className="text-slate-500">Service: </span>
                  <span className="text-ice-400">{alert.service}</span>
                </div>
              )}
              <div>
                <span className="text-slate-500">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => onResolve(alert.id)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-electric-400 border border-night-600 hover:border-electric-500/40 px-3 py-1.5 rounded-lg transition-all duration-150"
        >
          <CheckCircle size={13} />
          Resolve
        </button>
      </div>
    </div>
  )
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolvedIds, setResolvedIds] = useState(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        const res = await logApi.getAlerts()
        setAlerts(res.data)
      } catch {
        setAlerts(mockAlerts.data)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleResolve = async (id) => {
    try {
      await logApi.resolveAlert(id)
    } catch { /* ok */ }
    setResolvedIds(prev => new Set([...prev, id]))
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const activeAlerts = alerts.filter(a => !resolvedIds.has(a.id))
  const criticalCount = activeAlerts.filter(a => a.severity === 'CRITICAL').length
  const highCount = activeAlerts.filter(a => a.severity === 'HIGH').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-mono">Alert Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">Anomaly detection · threshold-based alerts</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-crimson-500/10 border border-crimson-500/20 rounded-lg">
            <Zap size={16} className="text-crimson-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-slate-100">{criticalCount}</p>
            <p className="text-xs text-slate-500 font-mono">Critical</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertTriangle size={16} className="text-orange-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-slate-100">{highCount}</p>
            <p className="text-xs text-slate-500 font-mono">High</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="p-2 bg-electric-500/10 border border-electric-500/20 rounded-lg">
            <Bell size={16} className="text-electric-400" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-slate-100">{activeAlerts.length}</p>
            <p className="text-xs text-slate-500 font-mono">Total Active</p>
          </div>
        </div>
      </div>

      {/* Alert config info */}
      <div className="card bg-night-900/50 border-dashed">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={13} className="text-slate-500" />
          <h3 className="text-xs font-mono font-medium text-slate-400">Alert Configuration</h3>
        </div>
        <p className="text-xs font-mono text-slate-500 leading-relaxed">
          Alerts trigger when error count increases by <span className="text-amber-400">≥200%</span> compared to the previous hour.
          Checks run every <span className="text-electric-400">60 minutes</span>.
          Monitored types: NullPointerException, DatabaseConnectionException, TimeoutException, HTTP500Error, OutOfMemoryError.
        </p>
      </div>

      {/* Active Alerts */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-500 font-mono text-sm">
          Loading alerts...
        </div>
      ) : activeAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <BellOff size={32} className="text-slate-700" />
          <p className="text-slate-500 font-mono text-sm">No active alerts — all systems nominal</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson-400 animate-pulse" />
            Active Alerts ({activeAlerts.length})
          </h2>
          {activeAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  )
}

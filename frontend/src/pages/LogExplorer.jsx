import { useState, useCallback } from 'react'
import { Search, Filter, RefreshCw, ChevronDown, ChevronRight, Clock, Server } from 'lucide-react'
import { logApi } from '../utils/api'
import { format } from 'date-fns'

const LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO', 'DEBUG']
const SERVICES = ['ALL', 'user-service', 'order-service', 'payment-service', 'api-gateway', 'analytics-service']

const MOCK_LOGS = Array.from({ length: 30 }, (_, i) => {
  const levels = ['ERROR', 'ERROR', 'WARN', 'INFO', 'ERROR', 'WARN']
  const services = ['user-service', 'order-service', 'payment-service', 'api-gateway', 'analytics-service']
  const errors = [
    { type: 'NullPointerException', msg: 'NullPointerException in UserService.findById() at line 142', cause: 'Uninitialized object reference' },
    { type: 'DatabaseConnectionException', msg: 'Unable to acquire JDBC Connection from pool - timeout after 30s', cause: 'Connection pool exhausted' },
    { type: 'TimeoutException', msg: 'Read timed out after 5000ms calling payment-gateway /charge', cause: 'External service latency' },
    { type: 'HTTP500Error', msg: 'HTTP 500 Internal Server Error - unhandled exception in OrderController', cause: 'Missing error handler' },
  ]
  const err = errors[i % errors.length]
  const level = levels[i % levels.length]
  return {
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 180000).toISOString(),
    level,
    message: err.msg,
    service: services[i % services.length],
    errorType: level === 'ERROR' ? err.type : null,
    rootCause: level === 'ERROR' ? err.cause : null,
    traceId: `trace-${Math.random().toString(36).substr(2, 9)}`,
    host: `pod-${Math.floor(Math.random() * 5) + 1}`,
    environment: 'production',
  }
})

function LevelBadge({ level }) {
  const cls = {
    ERROR: 'badge-error',
    WARN:  'badge-warn',
    INFO:  'badge-info',
    DEBUG: 'badge-ok',
  }[level] || 'badge-info'
  return <span className={cls}>{level}</span>
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr
        className="table-row cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-2.5 text-xs font-mono text-slate-500 whitespace-nowrap">
          {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
        </td>
        <td className="px-3 py-2.5"><LevelBadge level={log.level} /></td>
        <td className="px-3 py-2.5 text-xs font-mono text-ice-400 whitespace-nowrap">{log.service}</td>
        <td className="px-3 py-2.5 text-xs font-mono text-slate-300 max-w-md truncate">{log.message}</td>
        <td className="px-3 py-2.5 text-xs font-mono text-slate-500">
          {log.errorType && <span className="text-crimson-400">{log.errorType}</span>}
        </td>
        <td className="px-3 py-2.5 text-slate-600">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-night-900/60">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-2">
                <div><span className="text-slate-500">message: </span><span className="text-slate-200">{log.message}</span></div>
                <div><span className="text-slate-500">service: </span><span className="text-ice-400">{log.service}</span></div>
                <div><span className="text-slate-500">host: </span><span className="text-slate-300">{log.host}</span></div>
                <div><span className="text-slate-500">env: </span><span className="text-slate-300">{log.environment}</span></div>
              </div>
              <div className="space-y-2">
                <div><span className="text-slate-500">trace_id: </span><span className="text-amber-400">{log.traceId}</span></div>
                {log.errorType && <div><span className="text-slate-500">error_type: </span><span className="text-crimson-400">{log.errorType}</span></div>}
                {log.rootCause && (
                  <div className="col-span-2 mt-2 p-3 bg-crimson-500/5 border border-crimson-500/20 rounded-lg">
                    <p className="text-slate-400 mb-1">possible_cause:</p>
                    <p className="text-crimson-300">{log.rootCause}</p>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function LogExplorer() {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('ALL')
  const [service, setService] = useState('ALL')
  const [logs, setLogs] = useState(MOCK_LOGS)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(MOCK_LOGS.length)

  const search = useCallback(async () => {
    setLoading(true)
    try {
      const res = await logApi.search({
        q: query || undefined,
        level: level !== 'ALL' ? level : undefined,
        service: service !== 'ALL' ? service : undefined,
        page: 0, size: 50
      })
      setLogs(res.data.logs)
      setTotal(res.data.totalHits)
    } catch {
      // filter mock data locally
      let filtered = MOCK_LOGS
      if (query) filtered = filtered.filter(l => l.message.toLowerCase().includes(query.toLowerCase()) || l.errorType?.toLowerCase().includes(query.toLowerCase()))
      if (level !== 'ALL') filtered = filtered.filter(l => l.level === level)
      if (service !== 'ALL') filtered = filtered.filter(l => l.service === service)
      setLogs(filtered)
      setTotal(filtered.length)
    } finally {
      setLoading(false)
    }
  }, [query, level, service])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100 font-mono">Log Explorer</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search and filter across all log streams</p>
      </div>

      {/* Search bar */}
      <div className="card">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="search: database error, NullPointerException..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="input-field w-full pl-9"
            />
          </div>
          <select value={level} onChange={e => setLevel(e.target.value)} className="input-field">
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={service} onChange={e => setService(e.target.value)} className="input-field">
            {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={search} className="btn-primary flex items-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
        <Filter size={12} />
        <span>{total.toLocaleString()} log entries</span>
        {(query || level !== 'ALL' || service !== 'ALL') && (
          <button onClick={() => { setQuery(''); setLevel('ALL'); setService('ALL'); setLogs(MOCK_LOGS); setTotal(MOCK_LOGS.length) }} className="text-electric-400 hover:text-electric-300 ml-2">
            × clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-night-600 bg-night-900/50">
              <th className="px-4 py-3 text-left text-xs font-mono font-medium text-slate-500"><div className="flex items-center gap-1"><Clock size={11} /> Time</div></th>
              <th className="px-3 py-3 text-left text-xs font-mono font-medium text-slate-500">Level</th>
              <th className="px-3 py-3 text-left text-xs font-mono font-medium text-slate-500"><div className="flex items-center gap-1"><Server size={11} /> Service</div></th>
              <th className="px-3 py-3 text-left text-xs font-mono font-medium text-slate-500">Message</th>
              <th className="px-3 py-3 text-left text-xs font-mono font-medium text-slate-500">Error Type</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {logs.map(log => <LogRow key={log.id} log={log} />)}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-600 font-mono text-sm">
            No logs found matching your query
          </div>
        )}
      </div>
    </div>
  )
}

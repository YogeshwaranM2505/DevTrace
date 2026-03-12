import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  res => res.data,
  err => {
    console.error('API Error:', err.response?.data || err.message)
    return Promise.reject(err)
  }
)

export const logApi = {
  // Ingest a log entry
  ingest: (log) => api.post('/logs', log),

  // Get all errors (paginated)
  getErrors: (page = 0, size = 20) => api.get('/errors', { params: { page, size } }),

  // Get top error types
  getTopErrors: (limit = 10) => api.get('/errors/top', { params: { limit } }),

  // Get error timeline
  getTimeline: (hours = 24) => api.get('/errors/timeline', { params: { hours } }),

  // Search logs
  search: ({ q, level, service, from, to, page = 0, size = 20 }) =>
    api.get('/logs/search', { params: { q, level, service, from, to, page, size } }),

  // Dashboard stats
  getDashboard: () => api.get('/dashboard'),

  // Alerts
  getAlerts: () => api.get('/alerts'),
  resolveAlert: (id) => api.put(`/alerts/${id}/resolve`),
}

// Mock data for when backend is not available
export const mockDashboard = {
  data: {
    totalErrorsToday: 347,
    totalLogsToday: 12840,
    activeAlerts: 3,
    uniqueServicesAffected: 5,
    mostFrequentError: 'NullPointerException',
    errorRate: 2.7,
    topErrors: [
      { errorType: 'NullPointerException', count: 142, possibleCause: 'Uninitialized object reference', mostAffectedService: 'user-service', lastSeen: new Date().toISOString() },
      { errorType: 'DatabaseConnectionException', count: 89, possibleCause: 'Connection pool exhausted', mostAffectedService: 'order-service', lastSeen: new Date().toISOString() },
      { errorType: 'TimeoutException', count: 67, possibleCause: 'External service latency', mostAffectedService: 'payment-service', lastSeen: new Date().toISOString() },
      { errorType: 'HTTP500Error', count: 32, possibleCause: 'Unhandled server exception', mostAffectedService: 'api-gateway', lastSeen: new Date().toISOString() },
      { errorType: 'OutOfMemoryError', count: 17, possibleCause: 'JVM heap exhausted', mostAffectedService: 'analytics-service', lastSeen: new Date().toISOString() },
    ],
    timeline: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
      errorCount: Math.floor(Math.random() * 30) + 5,
      warnCount: Math.floor(Math.random() * 20) + 3,
      infoCount: Math.floor(Math.random() * 100) + 50,
    })),
    errorsByService: {
      'user-service': 142,
      'order-service': 89,
      'payment-service': 67,
      'api-gateway': 32,
      'analytics-service': 17,
    }
  }
}

export const mockAlerts = {
  data: [
    { id: '1', errorType: 'DatabaseConnectionException', message: 'ALERT: DatabaseConnectionException errors increased by 340%', currentCount: 89, previousCount: 20, percentageIncrease: 345, severity: 'CRITICAL', resolved: false, timestamp: new Date().toISOString(), service: 'order-service' },
    { id: '2', errorType: 'TimeoutException', message: 'ALERT: TimeoutException errors increased by 210%', currentCount: 67, previousCount: 22, percentageIncrease: 205, severity: 'HIGH', resolved: false, timestamp: new Date(Date.now() - 3600000).toISOString(), service: 'payment-service' },
    { id: '3', errorType: 'NullPointerException', message: 'ALERT: NullPointerException errors increased by 280%', currentCount: 142, previousCount: 37, percentageIncrease: 284, severity: 'HIGH', resolved: false, timestamp: new Date(Date.now() - 7200000).toISOString(), service: 'user-service' },
  ]
}

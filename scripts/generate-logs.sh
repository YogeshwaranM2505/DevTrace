#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# DevTrace – Sample Log Generator
# Generates realistic application logs for testing
# Usage: ./generate-logs.sh [count] [output-file]
# ─────────────────────────────────────────────────────────────────────────────

COUNT=${1:-200}
OUTPUT=${2:-"sample-logs/app.log"}
API_URL=${3:-"http://localhost:8080"}

mkdir -p "$(dirname "$OUTPUT")"

SERVICES=("user-service" "order-service" "payment-service" "api-gateway" "analytics-service" "notification-service")
HOSTS=("pod-1" "pod-2" "pod-3" "pod-4")
ENVS=("production")

ERRORS=(
  "ERROR|NullPointerException|NullPointerException in UserService.findById() at UserService.java:142"
  "ERROR|NullPointerException|java.lang.NullPointerException: Cannot invoke method getId() on null object"
  "ERROR|DatabaseConnectionException|Unable to acquire JDBC Connection - connection pool exhausted after 30s"
  "ERROR|DatabaseConnectionException|Could not connect to MySQL server on 'db-primary:3306' - Connection refused"
  "ERROR|TimeoutException|Read timed out after 5000ms calling payment-gateway POST /charge"
  "ERROR|TimeoutException|SocketTimeoutException: Connect timed out to inventory-service:8080"
  "ERROR|HTTP500Error|HTTP 500 Internal Server Error in OrderController.createOrder() - unhandled exception"
  "ERROR|HTTP500Error|Unhandled exception returned HTTP 500 to client 192.168.1.45"
  "ERROR|OutOfMemoryError|java.lang.OutOfMemoryError: Java heap space after processing 50000 records"
  "ERROR|AuthenticationException|JWT token validation failed - token expired at 2024-01-15T10:30:00Z"
  "WARN|TimeoutException|Slow query detected - took 4800ms (threshold: 3000ms)"
  "WARN|DatabaseConnectionException|Connection pool at 85% capacity (17/20 connections in use)"
)

INFO_MSGS=(
  "INFO|User login successful - userId=usr_12345"
  "INFO|Order created successfully - orderId=ord_98765 total=\$149.99"
  "INFO|Payment processed - transactionId=txn_11111 amount=\$149.99"
  "INFO|Cache hit ratio 94.2% - Redis operational"
  "INFO|Scheduled job 'CleanupExpiredSessions' completed - removed 234 sessions"
  "INFO|Health check passed - all 5 downstream services healthy"
  "INFO|API rate limiter: userId=usr_55555 requests=98/100 within window"
)

echo "🚀 Generating $COUNT sample logs → $OUTPUT"
echo "📡 Also sending to API: $API_URL"
echo ""

# Clear existing file
> "$OUTPUT"

for i in $(seq 1 $COUNT); do
  SERVICE=${SERVICES[$((RANDOM % ${#SERVICES[@]}))]}
  HOST=${HOSTS[$((RANDOM % ${#HOSTS[@]}))]}
  TIMESTAMP=$(date -u -d "-$((RANDOM % 86400)) seconds" '+%Y-%m-%dT%H:%M:%S.%3NZ' 2>/dev/null || date -u '+%Y-%m-%dT%H:%M:%S.000Z')
  TRACE_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "trace-$RANDOM-$RANDOM")

  # 30% chance of error, 15% warn, 55% info
  ROLL=$((RANDOM % 100))

  if [ $ROLL -lt 30 ]; then
    ERR=${ERRORS[$((RANDOM % ${#ERRORS[@]}))]}
    IFS='|' read -r LEVEL ERROR_TYPE MSG <<< "$ERR"
    LOG_LINE="{\"timestamp\":\"$TIMESTAMP\",\"level\":\"$LEVEL\",\"message\":\"$MSG\",\"service\":\"$SERVICE\",\"host\":\"$HOST\",\"environment\":\"production\",\"traceId\":\"$TRACE_ID\",\"errorType\":\"$ERROR_TYPE\"}"

    # Send to API
    curl -s -X POST "$API_URL/logs" \
      -H "Content-Type: application/json" \
      -d "{\"level\":\"$LEVEL\",\"message\":\"$MSG\",\"service\":\"$SERVICE\",\"host\":\"$HOST\",\"environment\":\"production\",\"traceId\":\"$TRACE_ID\"}" \
      > /dev/null 2>&1 || true

  else
    INFO=${INFO_MSGS[$((RANDOM % ${#INFO_MSGS[@]}))]}
    IFS='|' read -r LEVEL MSG <<< "$INFO"
    LOG_LINE="{\"timestamp\":\"$TIMESTAMP\",\"level\":\"$LEVEL\",\"message\":\"$MSG\",\"service\":\"$SERVICE\",\"host\":\"$HOST\",\"environment\":\"production\",\"traceId\":\"$TRACE_ID\"}"
  fi

  echo "$LOG_LINE" >> "$OUTPUT"

  # Progress indicator every 20 logs
  if [ $((i % 20)) -eq 0 ]; then
    echo "  ✓ Generated $i/$COUNT logs..."
  fi
done

echo ""
echo "✅ Done! Generated $COUNT logs"
echo "   📄 File: $OUTPUT"
echo "   📊 View at: http://localhost:3000"

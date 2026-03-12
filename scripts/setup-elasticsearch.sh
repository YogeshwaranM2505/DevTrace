#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# DevTrace – Elasticsearch Setup Script
# Creates index template, ILM policy, and initial indices
# Run after Elasticsearch is healthy
# ─────────────────────────────────────────────────────────────────────────────

ES_URL=${1:-"http://localhost:9200"}

echo "🔧 Setting up Elasticsearch at $ES_URL"
echo ""

# Wait for ES to be ready
echo "⏳ Waiting for Elasticsearch..."
until curl -sf "$ES_URL/_cluster/health" > /dev/null; do
  sleep 5
done
echo "✅ Elasticsearch is ready"
echo ""

# ── Create ILM Policy ─────────────────────────────────────────────────────────
echo "📋 Creating ILM policy (30-day retention)..."
curl -s -X PUT "$ES_URL/_ilm/policy/devtrace-ilm-policy" \
  -H "Content-Type: application/json" -d '{
    "policy": {
      "phases": {
        "hot": {
          "min_age": "0ms",
          "actions": {
            "rollover": { "max_age": "1d", "max_size": "50gb" },
            "set_priority": { "priority": 100 }
          }
        },
        "warm": {
          "min_age": "7d",
          "actions": {
            "shrink": { "number_of_shards": 1 },
            "forcemerge": { "max_num_segments": 1 },
            "set_priority": { "priority": 50 }
          }
        },
        "delete": {
          "min_age": "30d",
          "actions": { "delete": {} }
        }
      }
    }
  }' | jq . 2>/dev/null || echo "(jq not installed, raw output above)"
echo ""

# ── Create Index Template ─────────────────────────────────────────────────────
echo "📐 Creating index template..."
curl -s -X PUT "$ES_URL/_index_template/devtrace-logs-template" \
  -H "Content-Type: application/json" \
  -d @"$(dirname "$0")/../log-pipeline/logstash/devtrace-template.json" \
  | jq '.acknowledged' 2>/dev/null || echo "Template created"
echo ""

# ── Create Alerts Index ───────────────────────────────────────────────────────
echo "🔔 Creating alerts index..."
curl -s -X PUT "$ES_URL/devtrace-alerts" \
  -H "Content-Type: application/json" -d '{
    "settings": { "number_of_shards": 1, "number_of_replicas": 0 },
    "mappings": {
      "properties": {
        "timestamp":           { "type": "date" },
        "errorType":           { "type": "keyword" },
        "message":             { "type": "text" },
        "currentCount":        { "type": "long" },
        "previousCount":       { "type": "long" },
        "percentageIncrease":  { "type": "double" },
        "severity":            { "type": "keyword" },
        "resolved":            { "type": "boolean" },
        "service":             { "type": "keyword" }
      }
    }
  }' | jq '.acknowledged' 2>/dev/null || echo "Alerts index created"
echo ""

echo "✅ Elasticsearch setup complete!"
echo ""
echo "Indices:"
curl -s "$ES_URL/_cat/indices?v&h=index,status,docs.count,store.size" 2>/dev/null
echo ""
echo "ILM Policies:"
curl -s "$ES_URL/_cat/ilm?v" 2>/dev/null

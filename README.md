# 🔍 DevTrace – Production Error Analyzer

> A simplified, open-source log monitoring and error analysis platform inspired by Sentry/Datadog.  
> Built for CS students targeting backend + DevOps roles.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DevTrace Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Your App / Sample Logs]                                           │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐    │
│  │  Filebeat   │────▶│  Logstash    │────▶│  Elasticsearch   │    │
│  │ (collector) │     │ (processor)  │     │   (storage)      │    │
│  └─────────────┘     └──────────────┘     └──────────────────┘    │
│                                                  │                  │
│                                    ┌─────────────┴──────────────┐  │
│                                    │                            │  │
│                                    ▼                            ▼  │
│                           ┌──────────────┐          ┌──────────────┐│
│                           │ Spring Boot  │          │   Grafana    ││
│                           │  REST API   │          │  Dashboard   ││
│                           └──────────────┘          └──────────────┘│
│                                    │                                │
│                                    ▼                                │
│                           ┌──────────────┐                         │
│                           │    React     │                         │
│                           │  Dashboard  │                         │
│                           └──────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

```
Application → Log File → Filebeat → Logstash (parse/enrich) → Elasticsearch → Spring Boot API → React Dashboard
                                                                           ↘ Grafana (metrics)
```

## 📁 Project Structure

```
devtrace/
├── frontend/                  # React + TailwindCSS dashboard
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Dashboard, Logs, Analytics, Alerts
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # API client, helpers
│   ├── Dockerfile
│   └── package.json
├── backend/                   # Spring Boot REST API
│   ├── src/main/java/com/devtrace/
│   │   ├── controller/        # REST endpoints
│   │   ├── service/           # Business logic
│   │   ├── model/             # Data models
│   │   ├── repository/        # Elasticsearch repos
│   │   └── config/            # ES config, CORS, etc.
│   ├── Dockerfile
│   └── pom.xml
├── log-pipeline/
│   ├── filebeat/
│   │   └── filebeat.yml       # Filebeat config
│   └── logstash/
│       └── pipeline/
│           └── devtrace.conf  # Logstash pipeline
├── docker/
│   └── docker-compose.yml     # Full stack orchestration
├── monitoring/
│   └── grafana/
│       ├── dashboards/        # JSON dashboard definitions
│       └── provisioning/      # Auto-provisioning configs
├── ci-cd/
│   └── .github/workflows/
│       └── pipeline.yml       # GitHub Actions CI/CD
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Java 17+ (for local dev)
- Node.js 18+ (for local frontend dev)

### Run with Docker (Recommended)

```bash
git clone https://github.com/yourusername/devtrace.git
cd devtrace
docker compose -f docker/docker-compose.yml up -d
```

Access:
| Service | URL |
|---------|-----|
| React Dashboard | http://localhost:3000 |
| Spring Boot API | http://localhost:8080 |
| Elasticsearch | http://localhost:9200 |
| Grafana | http://localhost:3001 (admin/admin) |
| Kibana (optional) | http://localhost:5601 |

### Send a Test Log

```bash
curl -X POST http://localhost:8080/logs \
  -H "Content-Type: application/json" \
  -d '{"level":"ERROR","message":"NullPointerException in UserService","service":"user-service","timestamp":"2024-01-15T10:30:00Z"}'
```

### Generate Sample Logs

```bash
cd devtrace
./scripts/generate-logs.sh
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/logs` | Ingest a log entry |
| GET | `/errors` | List all errors |
| GET | `/errors/top` | Top occurring errors |
| GET | `/errors/timeline` | Error frequency over time |
| GET | `/errors/search?q=keyword` | Search logs by keyword |
| GET | `/alerts` | List active alerts |
| GET | `/health` | Service health check |

---

## 🏗️ Elasticsearch Index Design

```json
Index: devtrace-logs-{YYYY.MM.dd}

{
  "mappings": {
    "properties": {
      "timestamp":   { "type": "date" },
      "level":       { "type": "keyword" },
      "message":     { "type": "text", "analyzer": "standard" },
      "service":     { "type": "keyword" },
      "errorType":   { "type": "keyword" },
      "rootCause":   { "type": "text" },
      "host":        { "type": "keyword" },
      "environment": { "type": "keyword" },
      "traceId":     { "type": "keyword" }
    }
  }
}
```

---

## ☁️ Free Cloud Deployment

### Option 1: Oracle Cloud Free Tier (Recommended)
- 2 AMD VMs (1GB RAM each) — always free
- Deploy full stack with Docker Compose
- See `docs/deploy-oracle.md`

### Option 2: Railway.app
- Free tier: 500 hours/month
- Push to GitHub → auto deploy
- See `docs/deploy-railway.md`

### Option 3: Render.com
- Free tier for web services
- Managed Elasticsearch via Elastic Cloud (14-day trial)

---

## 📄 Resume Bullet Points

```
• Engineered DevTrace, a full-stack log monitoring platform using Spring Boot, 
  Elasticsearch, and React, capable of ingesting 10,000+ log events per minute

• Designed an ELK-stack pipeline (Filebeat → Logstash → Elasticsearch) with 
  custom Logstash filters for error classification and root cause analysis

• Built a real-time analytics dashboard using React + Recharts displaying error 
  timelines, frequency heatmaps, and service failure rates

• Containerized all services with Docker Compose (7 services) and automated 
  CI/CD via GitHub Actions with build, test, and Docker image publishing stages

• Implemented an intelligent alert engine that detects anomalous error spikes 
  using percentage-based thresholds and sends webhook notifications
```

---

## 🎤 Interview Q&A

**Q: Why Elasticsearch for log storage instead of PostgreSQL?**  
A: Elasticsearch is purpose-built for full-text search and time-series analytics. It handles millions of log documents with sub-second query times, supports fuzzy search natively, and its sharding model scales horizontally — ideal for log data that grows continuously.

**Q: How does Logstash differ from Filebeat?**  
A: Filebeat is a lightweight shipper that tails log files and forwards them. Logstash is a heavy-duty processing pipeline that can parse, filter, enrich, and route events. In this stack, Filebeat collects → Logstash transforms → Elasticsearch stores.

**Q: How would you scale DevTrace to handle 1M logs/minute?**  
A: Add Kafka between Filebeat and Logstash as a buffer, horizontally scale Logstash consumers, use Elasticsearch clustering with dedicated data nodes, and implement index lifecycle management (ILM) to roll over indices daily and delete old data.

**Q: How does your alert system detect anomalies?**  
A: It queries Elasticsearch for error counts in the current hour vs the previous hour per error type. If the percentage increase exceeds the threshold (default 200%), it creates an Alert document in Elasticsearch and can trigger webhooks.

**Q: What's a rolling index in Elasticsearch?**  
A: Instead of one huge index, we create time-based indices like `devtrace-logs-2024.01.15`. This allows us to delete old data efficiently (drop the whole index instead of deleting documents), apply different settings per period, and improves query performance when filtering by date.

**Q: Explain your Docker Compose architecture.**  
A: I used a single `docker-compose.yml` with a custom bridge network (`devtrace-net`) so all services discover each other by container name. Elasticsearch and Logstash are on the same network, Spring Boot connects to ES via hostname, and Grafana reads from ES directly. Health checks ensure services start in the right order.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Java 17, Spring Boot 3.x |
| Frontend | React 18, TailwindCSS, Recharts |
| Log Shipper | Filebeat 8.x |
| Log Processor | Logstash 8.x |
| Storage | Elasticsearch 8.x |
| Metrics Dashboard | Grafana 10.x |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## 📜 License

MIT License — free for personal and commercial use.

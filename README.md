# OpsPulse Monitoring Dashboard with Discord & Gmail Alerts

A production-style monitoring demo showcasing real-time observability with **Prometheus**, **Grafana**, and actionable alerts via **Discord** and **Gmail**.

`In Short'

A health monitor + alarm system for your web app. Watches your app’s basics—speed, errors, uptime, CPU, memory. Shows graphs on a dashboard. If something goes wrong (slow, lots of errors, app down), it pings you on Discord and emails you (Gmail) right away with links to investigate.


## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- k6 (for load testing)

### One-Command Setup

```bash
# Clone the repository
git clone <repository-url>
cd OpsPulse-Monitoring-Dashboard-with-Discord-Gmail-Alerts

# Start all services
cd ops
docker compose up -d
```

That's it! All services will be available at:

- **Application**: http://localhost:8080
- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093

## 🎯 Demo Scenarios

### 1. Trigger High Error Rate Alert

```bash
# Simulate errors to trigger HighErrorRate alert (>5% error rate for 5 minutes)
curl http://localhost:8080/simulate-error
```

### 2. Trigger High Latency Alert

```bash
# Enable slow mode to trigger HighLatencyP95 alert (>0.5s P95 for 5 minutes)
curl http://localhost:8080/chaos/slow
```

### 3. Trigger Instance Down Alert

```bash
# Stop the application to trigger InstanceDown alert
docker compose stop app
```

## 📊 Monitoring Stack

### Application (Node.js/Express)
- **Port**: 8080
- **Endpoints**:
  - `GET /` - Main application info
  - `GET /health` - Health check (returns 500 if chaos mode is ON)
  - `GET /simulate-error` - Simulates 500 error
  - `GET /chaos/:mode` - Controls chaos mode (on/off/slow)
  - `GET /metrics` - Prometheus metrics

### Metrics Collected
- `http_requests_total{method,route,code}` - Request counter
- `http_request_duration_seconds{le,method,route}` - Response time histogram
- `inflight_requests` - Current in-flight requests
- `chaos_mode_active` - Chaos mode status
- System metrics (CPU, memory, etc.)

### Prometheus
- **Port**: 9090
- **Scrape interval**: 15s
- **Jobs**: app, prometheus, blackbox, node
- **Alert rules**: HighErrorRate, HighLatencyP95, InstanceDown

### Grafana
- **Port**: 3000
- **Credentials**: admin/admin
- **Dashboard**: OpsPulse Service Overview
- **Panels**: RPS, Error %, Latency, System metrics

### Alertmanager
- **Port**: 9093
- **Notifications**: Discord (primary), Gmail (warnings)
- **Grouping**: By alert name
- **Repeat interval**: 6 hours

## 🔧 Configuration

### Environment Variables

Copy `ops/env.example` to `ops/.env` and configure:

```bash
# Discord Webhook (required for alerts)
DISCORD_SLACK_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN/slack

# Gmail (optional, for warning alerts)
ALERT_EMAILS=you@example.com,team@example.com
GMAIL_FROM=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### Setting up Discord Webhook

1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Create a new webhook
4. Copy the webhook URL and add `/slack` at the end
5. Update `DISCORD_SLACK_WEBHOOK_URL` in your `.env` file

### Setting up Gmail

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Update the Gmail variables in your `.env` file

## 🧪 Load Testing

Run the k6 load test to simulate realistic traffic and trigger alerts:

```bash
# Install k6 (if not already installed)
# macOS: brew install k6
# Linux: https://k6.io/docs/getting-started/installation/

# Run load test
k6 run tests/k6/load_test.js

# Or with custom base URL
k6 run -e BASE_URL=http://localhost:8080 tests/k6/load_test.js
```

The load test will:
- Ramp up to 500 virtual users over 5 minutes
- Generate 80% normal traffic, 5% errors, 15% slow requests
- Trigger HighErrorRate and HighLatencyP95 alerts
- Print a summary of results

## 📈 Alerts

### Alert Rules

| Alert | Condition | Duration | Severity |
|-------|-----------|----------|----------|
| HighErrorRate | Error rate > 5% | 5m | page |
| HighLatencyP95 | P95 latency > 0.5s | 5m | page |
| InstanceDown | Service down | 2m | page |
| HighCPUUsage | CPU > 80% | 5m | warning |
| HighMemoryUsage | Memory > 85% | 5m | warning |
| ChaosModeActive | Chaos mode enabled | 1m | warning |

### Alert Flow

1. **Prometheus** evaluates alert rules every 15s
2. **Alertmanager** receives alerts and groups them
3. **Discord** receives all alerts with Grafana/Alertmanager links
4. **Gmail** receives warning-level alerts only

## 🔍 Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check logs
docker compose logs

# Check if ports are available
netstat -an | grep :8080
netstat -an | grep :9090
netstat -an | grep :3000
```

#### No alerts in Discord
- Verify webhook URL ends with `/slack`
- Check Discord channel permissions
- Verify webhook is active in Discord server

#### No emails from Gmail
- Ensure 2FA is enabled on Gmail account
- Use App Password, not regular password
- Check Gmail account security settings

#### Metrics not showing in Grafana
- Verify Prometheus is scraping app:8080/metrics
- Check app is healthy: `curl http://localhost:8080/health`
- Restart Grafana: `docker compose restart grafana`

### Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f app
docker compose logs -f prometheus
docker compose logs -f alertmanager

# Check service status
docker compose ps

# Restart services
docker compose restart app
docker compose restart prometheus

# Access service shells
docker compose exec app sh
docker compose exec prometheus sh
```

## 🧹 Cleanup

```bash
# Stop all services
docker compose down

# Remove volumes (will delete all data)
docker compose down -v

# Remove images
docker compose down --rmi all
```

## 📁 Project Structure

```
ops-pulse/
├── app/                    # Node.js application
│   ├── src/
│   │   ├── index.ts       # Main application
│   │   ├── metrics.ts     # Prometheus metrics
│   │   └── routes.ts      # API routes
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── ops/                    # Monitoring stack
│   ├── docker-compose.yml
│   ├── prometheus/
│   │   ├── prometheus.yml
│   │   └── alert_rules.yml
│   ├── alertmanager/
│   │   └── alertmanager.yml
│   ├── grafana/
│   │   └── provisioning/
│   ├── blackbox/
│   │   └── blackbox.yml
│   └── env.example
├── tests/
│   └── k6/
│       └── load_test.js
└── docs/
    ├── README.md
    └── RUNBOOK.md
```

## 🧪 Development

### Local Development

```bash
# Install dependencies
cd app
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Prometheus](https://prometheus.io/) - Monitoring system
- [Grafana](https://grafana.com/) - Visualization platform
- [k6](https://k6.io/) - Load testing tool
- [Node.js](https://nodejs.org/) - Runtime environment

## 📚 Documentation

- [Detailed README](docs/README.md) - Comprehensive setup and usage guide
- [Runbook](docs/RUNBOOK.md) - Incident response and troubleshooting procedures

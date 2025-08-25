# OpsPulse Runbook

This runbook provides incident response procedures and troubleshooting guides for the OpsPulse monitoring demo.

## 🚨 Alert Response Procedures

### HighErrorRate Alert

**What it means**: Error rate exceeds 5% for 5 minutes.

**Common causes**:
- Application bugs or exceptions
- Database connection issues
- External service failures
- High load causing timeouts
- Chaos mode enabled

**First steps**:
1. **Check Grafana Dashboard**: http://localhost:3000/d/ops-pulse/service-overview
   - Look at Error Rate panel
   - Check which endpoints are failing
   - Review recent changes

2. **Check Application Logs**:
   ```bash
   docker compose logs -f app
   ```

3. **Verify Application Health**:
   ```bash
   curl http://localhost:8080/health
   ```

4. **Check Chaos Mode**:
   ```bash
   curl http://localhost:8080/chaos/off
   ```

**Escalation**:
- If error rate > 20%: Page on-call engineer
- If error rate > 50%: Page entire team
- If service completely down: Emergency response

### HighLatencyP95 Alert

**What it means**: 95th percentile response time exceeds 0.5 seconds for 5 minutes.

**Common causes**:
- High CPU usage
- Memory pressure
- Database slow queries
- Network latency
- Chaos mode in "slow" mode
- Resource exhaustion

**First steps**:
1. **Check System Resources**:
   - CPU usage in Grafana dashboard
   - Memory usage in Grafana dashboard
   - Disk I/O if applicable

2. **Check Application Performance**:
   ```bash
   # Check current latency
   curl -w "@-" -o /dev/null -s http://localhost:8080/ <<< "time_namelookup:  %{time_namelookup}\ntime_connect:  %{time_connect}\ntime_appconnect:  %{time_appconnect}\ntime_pretransfer:  %{time_pretransfer}\ntime_redirect:  %{time_redirect}\ntime_starttransfer:  %{time_starttransfer}\ntime_total:  %{time_total}\n"
   ```

3. **Check Chaos Mode**:
   ```bash
   curl http://localhost:8080/chaos/off
   ```

4. **Monitor In-flight Requests**:
   - Check Grafana dashboard for inflight_requests metric

**Escalation**:
- If P95 > 2s: Page on-call engineer
- If P95 > 5s: Page entire team
- If service unresponsive: Emergency response

### InstanceDown Alert

**What it means**: Service is completely down for 2 minutes.

**Common causes**:
- Application crash
- Container restart
- Host system issues
- Resource exhaustion
- Configuration errors

**First steps**:
1. **Check Service Status**:
   ```bash
   docker compose ps
   docker compose logs app
   ```

2. **Check Resource Usage**:
   ```bash
   docker stats
   ```

3. **Restart Service**:
   ```bash
   docker compose restart app
   ```

4. **Verify Recovery**:
   ```bash
   curl http://localhost:8080/health
   ```

**Escalation**:
- If service doesn't recover in 5 minutes: Page on-call engineer
- If multiple restarts fail: Page entire team
- If host system issues: Emergency response

### HighCPUUsage Alert

**What it means**: CPU usage exceeds 80% for 5 minutes.

**Common causes**:
- High application load
- Inefficient code
- Resource leaks
- Background processes
- Load testing

**First steps**:
1. **Check Application Load**:
   - Requests per second in Grafana
   - Check for unusual traffic patterns

2. **Check Process Details**:
   ```bash
   docker compose exec app top
   ```

3. **Check for Resource Leaks**:
   - Memory usage trends
   - Connection pool status

4. **Scale if Necessary**:
   ```bash
   # Increase resources in docker-compose.yml
   docker compose up -d --scale app=2
   ```

### HighMemoryUsage Alert

**What it means**: Memory usage exceeds 85% for 5 minutes.

**Common causes**:
- Memory leaks
- Large data processing
- Inefficient caching
- High concurrency

**First steps**:
1. **Check Memory Trends**:
   - Grafana memory usage panel
   - Look for steady increase

2. **Check Application Memory**:
   ```bash
   docker compose exec app ps aux
   ```

3. **Check for Memory Leaks**:
   - Restart application if needed
   - Monitor memory after restart

4. **Increase Memory Limits**:
   ```bash
   # Update docker-compose.yml with memory limits
   docker compose up -d
   ```

## 🔧 Troubleshooting Guides

### Application Won't Start

**Symptoms**: Container exits immediately or fails to start.

**Diagnosis**:
```bash
# Check logs
docker compose logs app

# Check container status
docker compose ps

# Check for port conflicts
netstat -an | grep :8080
```

**Common Solutions**:
1. **Port already in use**: Change port in docker-compose.yml
2. **Build errors**: Rebuild image with `docker compose build app`
3. **Permission issues**: Check file permissions
4. **Memory issues**: Increase Docker memory allocation

### Prometheus Not Scraping Metrics

**Symptoms**: No metrics in Prometheus or Grafana.

**Diagnosis**:
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check app metrics endpoint
curl http://localhost:8080/metrics

# Check Prometheus logs
docker compose logs prometheus
```

**Common Solutions**:
1. **App not responding**: Restart app service
2. **Network issues**: Check Docker network configuration
3. **Configuration errors**: Verify prometheus.yml syntax
4. **Scrape interval**: Check scrape_interval settings

### Grafana Dashboard Not Loading

**Symptoms**: Dashboard shows no data or fails to load.

**Diagnosis**:
```bash
# Check Grafana logs
docker compose logs grafana

# Check datasource configuration
curl http://localhost:3000/api/datasources

# Check Prometheus connectivity
curl http://localhost:3000/api/health
```

**Common Solutions**:
1. **Datasource not configured**: Check provisioning files
2. **Prometheus unreachable**: Verify network connectivity
3. **Authentication issues**: Check admin credentials
4. **Dashboard not provisioned**: Verify dashboard JSON

### Alerts Not Firing

**Symptoms**: No alerts in Alertmanager despite conditions being met.

**Diagnosis**:
```bash
# Check Prometheus alert rules
curl http://localhost:9090/api/v1/rules

# Check Alertmanager configuration
curl http://localhost:9093/api/v1/status

# Check alert evaluation
curl http://localhost:9090/api/v1/query?query=up
```

**Common Solutions**:
1. **Alert rules not loaded**: Check alert_rules.yml syntax
2. **Prometheus not evaluating**: Restart Prometheus
3. **Alertmanager not receiving**: Check alerting configuration
4. **Thresholds too high**: Adjust alert thresholds

### Discord Notifications Not Working

**Symptoms**: Alerts fire but no Discord messages.

**Diagnosis**:
```bash
# Check Alertmanager logs
docker compose logs alertmanager

# Test webhook manually
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"Test alert"}' \
  YOUR_DISCORD_WEBHOOK_URL
```

**Common Solutions**:
1. **Invalid webhook URL**: Verify URL ends with `/slack`
2. **Webhook disabled**: Check Discord server settings
3. **Channel permissions**: Verify bot has send permissions
4. **Rate limiting**: Check Discord rate limits

### Gmail Notifications Not Working

**Symptoms**: Warning alerts not sending emails.

**Diagnosis**:
```bash
# Check Alertmanager logs
docker compose logs alertmanager

# Verify environment variables
docker compose exec alertmanager env | grep GMAIL
```

**Common Solutions**:
1. **Invalid credentials**: Check Gmail app password
2. **2FA not enabled**: Enable 2-factor authentication
3. **SMTP settings**: Verify smtp.gmail.com:587
4. **Email format**: Check email addresses in configuration

## 🛠️ Maintenance Procedures

### Regular Health Checks

**Daily**:
- Review alert history in Alertmanager
- Check Grafana dashboard for trends
- Verify all services are running

**Weekly**:
- Review and update alert thresholds
- Check Prometheus retention settings
- Update Grafana dashboards if needed

**Monthly**:
- Review and rotate credentials
- Update container images
- Review monitoring coverage

### Backup Procedures

**Configuration Backup**:
```bash
# Backup configuration files
tar -czf ops-pulse-config-$(date +%Y%m%d).tar.gz \
  ops/prometheus/ \
  ops/alertmanager/ \
  ops/grafana/provisioning/ \
  ops/blackbox/
```

**Data Backup**:
```bash
# Backup Prometheus data
docker compose exec prometheus tar -czf /tmp/prometheus-data.tar.gz /prometheus

# Backup Grafana data
docker compose exec grafana tar -czf /tmp/grafana-data.tar.gz /var/lib/grafana
```

### Scaling Procedures

**Horizontal Scaling**:
```bash
# Scale application instances
docker compose up -d --scale app=3

# Update Prometheus configuration for multiple instances
# Add new targets to prometheus.yml
```

**Vertical Scaling**:
```bash
# Update resource limits in docker-compose.yml
# Restart services
docker compose up -d
```

## 🚫 Alert Silencing

### During Deployments

**Silence all alerts**:
```bash
# Create silence for deployment
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "team", "value": "ops-pulse", "isRegex": false}],
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "endsAt": "'$(date -u -d '+30 minutes' +%Y-%m-%dT%H:%M:%S.000Z)'",
    "createdBy": "deployment",
    "comment": "Silencing during deployment"
  }'
```

**Silence specific alerts**:
```bash
# Silence only HighErrorRate during deployment
curl -X POST http://localhost:9093/api/v1/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [
      {"name": "alertname", "value": "HighErrorRate", "isRegex": false},
      {"name": "team", "value": "ops-pulse", "isRegex": false}
    ],
    "startsAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "endsAt": "'$(date -u -d '+10 minutes' +%Y-%m-%dT%H:%M:%S.000Z)'",
    "createdBy": "deployment",
    "comment": "Silencing HighErrorRate during deployment"
  }'
```

### List Active Silences

```bash
# View all silences
curl http://localhost:9093/api/v1/silences

# View specific silence
curl http://localhost:9093/api/v1/silence/SILENCE_ID
```

### Delete Silences

```bash
# Delete specific silence
curl -X DELETE http://localhost:9093/api/v1/silence/SILENCE_ID
```

## 📞 Escalation Contacts

### On-Call Rotation
- **Primary**: [On-call engineer name]
- **Secondary**: [Backup engineer name]
- **Manager**: [Manager name]

### Emergency Contacts
- **Infrastructure**: [Infra team contact]
- **Database**: [DB team contact]
- **Security**: [Security team contact]

### Communication Channels
- **Slack**: #ops-pulse-alerts
- **Email**: ops-pulse@company.com
- **Phone**: [Emergency phone number]

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [k6 Documentation](https://k6.io/docs/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

## 🔄 Runbook Updates

This runbook should be updated whenever:
- New alerts are added
- Procedures change
- New troubleshooting steps are identified
- Contact information changes

**Last Updated**: [Date]
**Version**: 1.0
**Maintainer**: [Team name] 
# Uptime monitoring

## Health endpoint

The app exposes `GET /healthz` which:
- Pings the database (`SELECT 1`)
- Returns `200 {"ok": true, "durationMs": <n>}` when healthy
- Returns `503 {"ok": false, "error": "..."}` when DB is unreachable

Test:
```bash
curl https://recruit.example.com/healthz
```

## UptimeRobot setup (5 minutes)

1. Sign up at https://uptimerobot.com (free tier: 50 monitors, 5-min interval)
2. Click **+ New Monitor**
3. Configure:
   - **Monitor type:** HTTP(s)
   - **Friendly Name:** `Recruit prod`
   - **URL:** `https://recruit.example.com/healthz`
   - **Interval:** 5 minutes (the free tier minimum)
   - **Keyword (optional):** `"ok":true` — catches DB-down case where the server returns 503 with `ok:false`
4. Under **Alert Contacts**, add your email + (optional) Telegram/Slack webhook
5. Save

Recommended additional monitors:
- `https://recruit.example.com/login` — keyword `Sign in`, catches deeper render breakage
- `https://recruit.example.com/` — catches root-level routing breakage

## Cert expiry alert

UptimeRobot also alerts on SSL cert expiry by default. Cert is auto-renewed by certbot but worth having a backstop. Confirm SSL Monitoring is enabled on the monitor settings.

## Internal cron-based alternative (no third-party)

If you don't want a third-party monitor, a cron job on this server can ping `/healthz` and email on failure. This won't catch the case where the *server itself* is down (since the cron is on the same server), but it does catch app-level failures.

Example `/etc/cron.d/recruit-healthcheck`:
```cron
*/5 * * * * root curl -fsS --max-time 10 http://127.0.0.1:3000/healthz > /dev/null || echo "Recruit health check failed at $(date -u)" | mail -s "Recruit DOWN" ops@example.com
```

(Requires `mailutils` and a configured MTA. UptimeRobot is simpler.)

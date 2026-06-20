// PM2 process config for the Recruit app.
// Registered once via:
//   pm2 start ecosystem.config.js
//   pm2 save
// Subsequent deploys use:
//   pm2 reload recruit --update-env

module.exports = {
  apps: [
    {
      name: "recruit",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      exec_mode: "fork",
      instances: 1,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      // pm2 reads .env via dotenv; we keep config out of pm2 so secrets stay in .env
      env_file: ".env",
      // Restart on crash but back off after repeated failures
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      listen_timeout: 10000,
      kill_timeout: 5000,
      // Logs land in pm2's default location (~/.pm2/logs)
      merge_logs: true,
      time: true,
    },
  ],
};

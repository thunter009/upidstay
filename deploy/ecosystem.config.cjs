// PM2 ecosystem file — manages upidstay app + GitHub Actions runner
// Usage: pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "upidstay",
      script: "./node_modules/.bin/tsx",
      args: "server.ts",
      cwd: "/Users/jasper/apps/upidstay",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: "3080",
        DB_PATH: "data/chat.db",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 5000,
    },
    {
      name: "github-runner",
      script: "./run.sh",
      cwd: "/Users/jasper/actions-runner",
      interpreter: "bash",
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
    },
  ],
};

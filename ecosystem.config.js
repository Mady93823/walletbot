module.exports = {
  apps: [
    {
      name: "wallet-bot",
      script: "./dist/bot.js",
      env: {
        NODE_ENV: "production",
      },
      // Restart if memory exceeds 500M (optional, good for stability)
      max_memory_restart: '500M',
      // Delay between restarts if it crashes
      exp_backoff_restart_delay: 100
    },
    {
      name: "wallet-frontend",
      cwd: "./webapp",
      script: "server.js",
      env: {
        PORT: 3001,
        NODE_ENV: "production"
      },
      max_memory_restart: '300M'
    }
  ]
};

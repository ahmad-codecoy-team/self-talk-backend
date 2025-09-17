module.exports = {
  apps: [
    {
      name: 'self-talk-api',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '500M',
      node_args: '--max-old-space-size=500',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: ['node_modules', 'uploads', 'logs'],
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 8000
    }
  ]
};
export const CONFIG = {
  PORT: process.env.PORT || 3000,
  DB_PATH: 'security.db',
  LOG_PATH: 'security.log',
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  },
  FILE_WATCH: {
    ignored: [
      /(^|[\/\\])\../, // dotfiles
      '**/node_modules/**',
      '**/*.db*',
      '**/*.log'
    ],
    persistent: true
  },
  TEST: {
    INTERVAL: 30000, // 30 seconds
    TEMP_DIR: './temp-test',
    HTTP_PATTERNS: [
      { path: '/admin.php', method: 'GET' },
      { path: '/wp-login.php', method: 'POST', body: "username=admin'+OR+'1'='1" },
      { path: '../../../etc/passwd', method: 'GET' },
      { path: '/api/users', method: 'GET', headers: { 'User-Agent': 'SQLMap/1.4' } }
    ]
  }
};
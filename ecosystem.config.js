module.exports = {
  apps: [
    {
      name: 'jarvis-api',
      script: 'index.js',
      instances: 1,
      exec_mode: 'cluster',
      env_file: '.env',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
    }
  ]
};

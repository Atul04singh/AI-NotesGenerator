module.exports = {
  apps: [
    {
      name: "orchestrator",
      script: "app.js",
      cwd: "./services/orchestrator",
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
    {
      name: "index-service",
      script: "indexApi.js",
      cwd: "./services/index-service",
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "content-service",
      script: "app.js",
      cwd: "./services/content-service",
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "app-ui",
      script: "app.js",
      cwd: "./services/app-ui",
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
    },
  ],
};

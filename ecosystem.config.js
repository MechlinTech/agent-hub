module.exports = {
  apps: [
    { name: "agenthub-ui", script: "npm", args: "start", cwd: __dirname },
    {
      name: "agenthub-executor",
      script: "packages/local-executor/bin/start.mjs",
      cwd: __dirname,
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'DJ Peepo',
      script: './build/src/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

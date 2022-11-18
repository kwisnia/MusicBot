module.exports = {
  apps: [
    {
      name: 'DJ Peepo',
      script: './build/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

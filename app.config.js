module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    posthogApiKey: process.env.POSTHOG_API_KEY ?? 'phc_demo_key_placeholder',
    posthogHost: process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com',
  },
});

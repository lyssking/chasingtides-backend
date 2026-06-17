export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    // 🛠️ Fix: Fallback to safe, hardcoded placeholder keys if Railway env variables are missing
    keys: env.array('APP_KEYS', [
      'chasingTidesSecureAppKeyAlpha2026!!!',
      'chasingTidesSecureAppKeyBeta2026!!!'
    ]),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
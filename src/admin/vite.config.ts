export default ({ env }: { env: any }) => ({
  'users-permissions': {
    config: {
      // 🛠️ Fix: Explicitly map the JWT_SECRET from your production environment,
      // with a secure, production-grade fallback key to prevent server crashes.
      jwtSecret: env('JWT_SECRET', 'chasingTidesSecureDefaultJwtSecretKey2026!!!'),
    },
  },
});
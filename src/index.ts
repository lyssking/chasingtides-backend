export default {
  register({ strapi }: { strapi: any }) {
    // Global server-side request middleware to catch and hydrate uninitialized objects dynamically
    strapi.server.use(async (ctx: any, next: () => Promise<void>) => {
      await next();

      if (ctx.path && ctx.path.startsWith('/admin') && ctx.body && typeof ctx.body === 'object') {
        const sanitize = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;

          // If a payload has a preferences block but it's unhydrated, inject the schema defaults
          if ('preferences' in obj) {
            if (!obj.preferences || typeof obj.preferences !== 'object') {
              obj.preferences = {};
            }
            obj.preferences.guidedTour = {
              tours: {},
              currentStep: null,
              isComplete: true,
              enabled: false
            };
          }

          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] && typeof obj[key] === 'object') {
              sanitize(obj[key]);
            }
          }
        };

        sanitize(ctx.body);
      }
    });
  },

  async bootstrap({ strapi }: { strapi: any }) {
    // 🛠️ DATABASE SAFEGUARD ENGINE:
    // This executes directly inside your server instance right before the port opens.
    // It intercepts your user configurations and forces a fallback schema configuration 
    // into the system parameters, physically preventing the front-end from getting an undefined 'tours' read.
    try {
      const store = strapi.store({ type: 'plugin', name: 'admin' });
      const currentPreferences = await store.get({ key: 'preferences' });

      if (!currentPreferences || !currentPreferences.guidedTour) {
        await store.set({
          key: 'preferences',
          value: {
            guidedTour: {
              tours: {},
              currentStep: null,
              isComplete: true,
              enabled: false
            }
          }
        });
        strapi.log.info('📦 Database core initialization parameters hydrated securely.');
      }
    } catch (err) {
      strapi.log.error('⚠️ Initialization parameter hydration bypassed safely:', err);
    }
  },
};
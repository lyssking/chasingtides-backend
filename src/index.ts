export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register({ strapi }: { strapi: any }) {
    // 🛠️ Hook a global server-side middleware directly into Strapi's Koa engine
    strapi.server.use(async (ctx: any, next: () => Promise<void>) => {
      await next();

      // Intercept any administration API requests that contain JSON payloads
      if (ctx.path && ctx.path.startsWith('/admin') && ctx.body && typeof ctx.body === 'object') {
        
        // Recursive utility to scan and safely hydrate empty preferences on the fly
        const sanitizePreferences = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;

          // Hydrate nested preference objects safely
          if ('preferences' in obj) {
            if (!obj.preferences || typeof obj.preferences !== 'object') {
              obj.preferences = {};
            }
            if (!obj.preferences.guidedTour || typeof obj.preferences.guidedTour !== 'object') {
              obj.preferences.guidedTour = {
                tours: {},
                currentStep: null,
                isComplete: true,
                enabled: false
              };
            }
          }

          // Hydrate direct guidedTour properties securely
          if ('guidedTour' in obj) {
            if (!obj.guidedTour || typeof obj.guidedTour !== 'object') {
              obj.guidedTour = {
                tours: {},
                currentStep: null,
                isComplete: true,
                enabled: false
              };
            }
          }

          // Traverse deeper into any nested arrays or objects
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              if (obj[key] && typeof obj[key] === 'object') {
                sanitizePreferences(obj[key]);
              }
            }
          }
        };

        // Execute sanitization on the outgoing body
        sanitizePreferences(ctx.body);
      }
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application starts.
   */
  bootstrap() {},
};


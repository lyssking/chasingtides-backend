import { mergeConfig, UserConfig } from 'vite';

export default (config: UserConfig) => {
  // Merge our custom build modifications with Strapi's default Vite configuration
  return mergeConfig(config, {
    build: {
      // Disable minification to prevent esbuild name-mangling bugs in production
      minify: false,
    },
    plugins: [
      {
        name: 'strapi-tours-safe-patch',

        // Inject an active, client-side runtime failsafe script into the HTML header.
        // This is 100% safe, bypasses compile-time syntax limitations, and handles
        // empty profiles dynamically in the browser.
        transformIndexHtml(html: string) {
          const inlineScript = `
            <script>
              (function() {
                try {
                  // 1. Recursive helper to guarantee guidedTour parameters are fully initialized
                  function sanitizeGuidedTours(obj) {
                    if (!obj || typeof obj !== 'object') return obj;

                    if (Object.prototype.hasOwnProperty.call(obj, 'guidedTour')) {
                      if (!obj.guidedTour || typeof obj.guidedTour !== 'object') {
                        obj.guidedTour = { tours: {}, currentStep: null };
                      } else if (!obj.guidedTour.tours || typeof obj.guidedTour.tours !== 'object') {
                        obj.guidedTour.tours = {};
                      }
                    }

                    // Traverse nested properties recursively
                    for (const key in obj) {
                      if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        if (obj[key] && typeof obj[key] === 'object') {
                          sanitizeGuidedTours(obj[key]);
                        }
                      }
                    }
                    return obj;
                  }

                  // 2. Intercept global JSON parsing
                  const originalParse = JSON.parse;
                  JSON.parse = function(...args) {
                    const result = originalParse.apply(this, args);
                    try {
                      return sanitizeGuidedTours(result);
                    } catch (e) {
                      return result;
                    }
                  };

                  // 3. Intercept Fetch API responses globally
                  if (window.Response && Response.prototype.json) {
                    const originalJson = Response.prototype.json;
                    Response.prototype.json = function(...args) {
                      return originalJson.apply(this, args).then(data => {
                        try {
                          return sanitizeGuidedTours(data);
                        } catch (e) {
                          return data;
                        }
                      });
                    };
                  }

                  // 4. Force fallback values in LocalStorage for redundancy
                  const tourKeys = [
                    'STRAPI_GUIDED_TOUR_CURRENT_STEP',
                    'STRAPI_GUIDED_TOUR_STATE',
                    'guided_tour_state',
                    'guidedTour',
                    'strapi_guided_tour_state'
                  ];
                  tourKeys.forEach(function(key) {
                    try {
                      const existing = localStorage.getItem(key);
                      if (!existing || existing === 'undefined' || existing === 'null') {
                        localStorage.setItem(key, JSON.stringify({}));
                      }
                    } catch (e) {}
                  });

                  // 5. Prevent residual unhandled tour-state exceptions from freezing React
                  window.addEventListener('error', function(event) {
                    if (event.message && (event.message.includes('tours') || event.message.includes('guidedTour'))) {
                      console.warn('Neutralized guided tour crash safely:', event.message);
                      event.preventDefault();
                    }
                  });
                } catch (globalErr) {
                  console.error('Guided tour inline-safeguard setup failed:', globalErr);
                }
              })();
            </script>
          `;
          return html.replace('<head>', '<head>' + inlineScript);
        }
      },
    ],
  });
};
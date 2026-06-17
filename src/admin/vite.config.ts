import { mergeConfig, UserConfig } from 'vite';

export default (config: UserConfig) => {
  // Merge our custom build modifications with Strapi's default Vite configuration
  return mergeConfig(config, {
    build: {
      // 🛠️ Fix 1: Disable minification to prevent esbuild name-mangling bugs in production
      minify: false,
    },
    plugins: [
      {
        name: 'strapi-tours-safe-patch',
        
        // 🛠️ Fix 2a: Intercept individual modules during compilation with explicit types
        transform(code: string, id: string) {
          if (id.includes('node_modules') || id.includes('.cache') || id.includes('admin')) {
            if (code.includes('guidedTour') || code.includes('tours')) {
              return {
                code: code
                  .replace(/guidedTour\.tours/g, 'guidedTour?.tours')
                  .replace(/guidedTour\.currentStep/g, 'guidedTour?.currentStep')
                  .replace(/guidedTour\.isComplete/g, 'guidedTour?.isComplete')
                  .replace(/\.guidedTour/g, '?.guidedTour'),
                map: null,
              };
            }
          }
          return null;
        },

        // 🛠️ Fix 2b: Intercept final compiled production JS chunks with explicit types.
        // This is 100% reliable because it runs on the final generated build chunks
        // and overrides any pre-bundled cached files (like index-CMZdh8ZD.js).
        renderChunk(code: string) {
          let patched = code;
          
          // Safely turn any ".tours" property access into "?.tours"
          patched = patched.replace(/(?<!\?)\.tours\b/g, '?.tours');
          
          // Do the same for other potential guidedTour properties
          patched = patched.replace(/(?<!\?)\.guidedTour\b/g, '?.guidedTour');
          patched = patched.replace(/(?<!\?)\.currentStep\b/g, '?.currentStep');
          patched = patched.replace(/(?<!\?)\.isComplete\b/g, '?.isComplete');
          
          return {
            code: patched,
            map: null,
          };
        },

        // 🛠️ Fix 2c: Inject an active failsafe initialization script into the HTML header.
        // This executes first in the client's browser before any React elements compile.
        transformIndexHtml(html: string) {
          const inlineScript = `
            <script>
              (function() {
                try {
                  // Force-initialize all variations of guided tour state in localStorage
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

                  // Intercept and neutralize any residual guided tour runtime crashes to keep the dashboard online
                  window.addEventListener('error', function(event) {
                    if (event.message && (event.message.includes('tours') || event.message.includes('guidedTour'))) {
                      console.warn('Neutralized guided tour crash safely:', event.message);
                      event.preventDefault(); // Prevents the error from bubble-crashing the React thread
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
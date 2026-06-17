import { mergeConfig } from 'vite';

export default (config) => {
  // Merge our custom build modifications with Strapi's default Vite configuration
  return mergeConfig(config, {
    build: {
      // 🛠️ Fix 1: Disable minification to prevent esbuild name-mangling bugs in production
      minify: false,
    },
    plugins: [
      {
        name: 'strapi-tours-safe-patch',
        transform(code, id) {
          // 🛠️ Fix 2: Intercept the admin compilation to safe-guard guided tours
          // This prevents the fatal "Cannot read properties of undefined (reading 'tours')" crash
          if (id.includes('node_modules') || id.includes('.cache') || id.includes('admin')) {
            if (code.includes('guidedTour') || code.includes('tours')) {
              const patched = code
                .replace(/guidedTour\.tours/g, 'guidedTour?.tours')
                .replace(/guidedTour\.currentStep/g, 'guidedTour?.currentStep')
                .replace(/guidedTour\.isComplete/g, 'guidedTour?.isComplete')
                .replace(/\.guidedTour/g, '?.guidedTour');
              return {
                code: patched,
                map: null,
              };
            }
          }
          return null;
        },
      },
    ],
  });
};
import { mergeConfig } from 'vite';

export default (config) => {
  // Merge our custom build modifications with Strapi's default Vite configuration
  return mergeConfig(config, {
    build: {
      // 🛠️ Fix: Disable minification to prevent esbuild name-mangling bugs in production
      minify: false,
    },
  });
};
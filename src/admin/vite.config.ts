import { mergeConfig, UserConfig } from 'vite';

export default (config: UserConfig) => {
  // Merge our custom build modifications with Strapi's default Vite configuration
  return mergeConfig(config, {
    build: {
      // Disable minification to prevent esbuild name-mangling bugs in production
      minify: false,
    },
    // We clean up any risky build-time AST replacements to avoid compilation crashes
    plugins: [],
  });
};
import { mergeConfig, UserConfig } from 'vite';

export default (config: UserConfig) => {
  // 🛠️ Clear local build crash: 
  // Vite runs in an isolated frontend compiler sandbox where the backend 
  // "env()" helper does not exist. Keeping it empty restores standard behavior.
  return mergeConfig(config, {
    build: {},
  });
};
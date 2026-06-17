export default {
  config: {
    // 🛠️ The Ultimate Fix: Disable the guided tours/tutorials completely.
    // This stops Strapi from trying to read non-existent database preference records,
    // which prevents the white-screen crash entirely and lets you log in!
    tutorials: false,
    notifications: {
      release: false,
    },
  },
  bootstrap(app: any) {
    console.log('Strapi Admin Bootstrapped safely with tutorials disabled.');
  },
};
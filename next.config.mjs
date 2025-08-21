import withPWA from 'next-pwa';

const isProd = process.env.NODE_ENV === 'production';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: !isProd, // sólo activa PWA en producción
  // Opcional: fallbacks offline si los agregas
  // fallbacks: { document: '/offline' }
})({
  reactStrictMode: true,
  experimental: { appDir: true }
});

// FILE: postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

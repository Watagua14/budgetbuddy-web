/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
};

// FILE: app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

/* Utilidades ligeras */
.btn{ @apply border border-gray-200 rounded-full px-3 py-1.5 bg-white; }
.btn-primary{ @apply rounded-full px-3 py-1.5 text-white bg-indigo-500; }
.pill{ @apply border border-gray-200 rounded-full px-2.5 py-1 bg-white; }
.card{ @apply bg-white border border-gray-200 rounded-2xl p-4 shadow-sm; }
.backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.3); backdrop-filter:saturate(120%) blur(4px); }
.sheet{ position:fixed; left:0; right:0; bottom:0; background:white; border-top-left-radius:16px; border-top-right-radius:16px; padding:16px; box-shadow:0 -8px 24px rgba(0,0,0,.15) }
.input{ @apply border border-gray-200 rounded-xl p-2; }

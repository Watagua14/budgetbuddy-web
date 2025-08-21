export const metadata = {
  title: 'BudgetBuddy Web',
  description: 'Presupuesto mensual — PWA offline',
  manifest: '/manifest.webmanifest'
};

export const viewport = {
  themeColor: '#6366f1',
};

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}

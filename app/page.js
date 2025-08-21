import dynamic from 'next/dynamic';

// Cargamos TODO el frontend como client-only
const ClientApp = dynamic(() => import('../components/ClientApp'), { ssr: false });

export const metadata = {
  title: 'BudgetBuddy Web',
  description: 'Presupuesto mensual — PWA offline',
  manifest: '/manifest.webmanifest'
};

// (Opcional) si aún ves warning de themeColor en el build,
// muévelo a viewport en app/layout.js (te dejo ejemplo abajo).

export default function Page() {
  // En SSR se renderiza un contenedor vacío que es 100% serializable,
  // y en el cliente se hidrata ClientApp.
  return <ClientApp />;
}

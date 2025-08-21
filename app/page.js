import dynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata = {
  title: 'BudgetBuddy Web',
  description: 'Presupuesto mensual — PWA offline',
  manifest: '/manifest.webmanifest'
};

// Cargamos TODO el frontend como client-only
const ClientApp = dynamic(() => import('../components/ClientApp'), { ssr: false });

export default function Page() {
  return <ClientApp />;
}

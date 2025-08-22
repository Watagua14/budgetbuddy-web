'use client';
import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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

'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Formateo CRC local (no pasamos funciones por props)
const CRC = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'CRC',
  currencyDisplay: 'symbol',
  maximumFractionDigits: 0
});

export default function CategoryChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="name" innerRadius={50} outerRadius={80}>
            {data.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip formatter={(v) => CRC.format(v)} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

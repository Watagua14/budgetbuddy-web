'use client';
import { useEffect, useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// ----- Utilidades -----
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

// Formateo de moneda — CRC por defecto
const CRC = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CRC', currencyDisplay: 'symbol', maximumFractionDigits: 0 });
const fmtMoney = (n) => CRC.format(n);

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return typeof initial === 'function' ? initial() : initial;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : (typeof initial === 'function' ? initial() : initial);
  });
  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(state)); }, [key, state]);
  return [state, setState];
}

export default function Page() {
  const [categories, setCategories] = useLocalState('bb.categories', () => [
    { id: uid(), name: 'Salario', icon: '💵', color: '#16A34A', isIncome: true },
    { id: uid(), name: 'Venta', icon: '🛒', color: '#10B981', isIncome: true },
    { id: uid(), name: 'Comida', icon: '🍽️', color: '#EF4444', isIncome: false },
    { id: uid(), name: 'Transporte', icon: '🚗', color: '#22C55E', isIncome: false },
    { id: uid(), name: 'Servicios', icon: '⚡', color: '#F59E0B', isIncome: false },
    { id: uid(), name: 'Renta', icon: '🏠', color: '#3B82F6', isIncome: false },
    { id: uid(), name: 'Ocio', icon: '✨', color: '#A855F7', isIncome: false },
  ]);
  const [txns, setTxns] = useLocalState('bb.txns', []);
  const [budgets, setBudgets] = useLocalState('bb.budgets', []);
  const [activeMonth, setActiveMonth] = useState(monthKey());
  const [sheet, setSheet] = useState(null);

  const activeYearNum = Number(activeMonth.split('-')[0]);
  const activeMonthNum = Number(activeMonth.split('-')[1]);
  const start = startOfMonth(new Date(activeYearNum, activeMonthNum - 1, 1));
  const end = endOfMonth(new Date(activeYearNum, activeMonthNum - 1, 1));

  const monthTxns = useMemo(() => txns.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  }), [txns, activeMonth]);

  const monthBudget = useMemo(() => budgets.find(b => b.year === activeYearNum && b.month === activeMonthNum)?.amount || 0, [budgets, activeMonth]);
  const income = useMemo(() => monthTxns.filter(t => (categories.find(c => c.id === t.categoryId)?.isIncome)).reduce((s, t) => s + t.amount, 0), [monthTxns, categories]);
  const expense = useMemo(() => monthTxns.filter(t => !(categories.find(c => c.id === t.categoryId)?.isIncome)).reduce((s, t) => s + t.amount, 0), [monthTxns, categories]);
  const remaining = Math.max(monthBudget + income - expense, 0);

  const expenseByCat = useMemo(() => {
    const map = new Map();
    for (const t of monthTxns) {
      const cat = categories.find(c => c.id === t.categoryId);
      if (!cat || cat.isIncome) continue;
      map.set(cat.id, { name: cat.name, color: cat.color, total: (map.get(cat.id)?.total || 0) + t.amount });
    }
    return Array.from(map.values()).sort((a,b)=>b.total-a.total);
  }, [monthTxns, categories]);

  const addTxn = (data) => setTxns(prev => [{ ...data, id: uid() }, ...prev]);
  const updateTxn = (id, data) => setTxns(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  const deleteTxn = (id) => setTxns(prev => prev.filter(t => t.id !== id));
  const addCategory = (c) => setCategories(prev => [...prev, { ...c, id: uid() }]);
  const setBudget = (amount) => {
    setBudgets(prev => {
      const idx = prev.findIndex(b => b.year === activeYearNum && b.month === activeMonthNum);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], amount }; return copy; }
      return [...prev, { year: activeYearNum, month: activeMonthNum, amount }];
    });
  };
  const goMonth = (delta) => {
    const d = new Date(activeYearNum, activeMonthNum - 1 + delta, 1);
    setActiveMonth(monthKey(d));
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <h1 className="text-lg font-semibold">BudgetBuddy — Presupuesto Mensual</h1>
          <div className="ml-auto flex items-center gap-2">
            <button className="btn" onClick={() => setSheet('set-budget')}>Presupuesto</button>
            <button className="btn" onClick={() => setSheet('add-cat')}>Categoría</button>
            <button className="btn-primary" onClick={() => setSheet('add-txn')}>Movimiento</button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-center gap-2 py-4">
          <button className="pill" onClick={() => goMonth(-1)}>◀︎</button>
          <div className="font-medium">{new Date(activeYearNum, activeMonthNum - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button className="pill" onClick={() => goMonth(1)}>▶︎</button>
        </div>

        <section className="grid grid-cols-1 gap-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2"><span>🎯</span><h2 className="font-semibold">Resumen del mes</h2></div>
            <div className="grid grid-cols-3 gap-3">
              <Stat title="Presupuesto" value={fmtMoney(monthBudget)} />
              <Stat title="Ingresos" value={fmtMoney(income)} />
              <Stat title="Gastos" value={fmtMoney(expense)} />
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Restante</span>
                <span>{Math.min(100, Math.round(((Math.max(expense - income, 0)) / (monthBudget || 1)) * 100))}% usado</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${monthBudget ? Math.min(100, ((Math.max(expense - income, 0)) / monthBudget) * 100) : 0}%` }} />
              </div>
              <div className="text-sm mt-2">Restante: <b>{fmtMoney(remaining)}</b></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 mt-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2"><span>🍰</span><h2 className="font-semibold">Gasto por categoría</h2></div>
            {/* Recharts se usa en el canvas anterior; si no lo estás usando aquí, puedes omitirlo */}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-2 mt-4 mb-24">
          <div className="flex items-center gap-2"><span>📋</span><h2 className="font-semibold">Movimientos del mes</h2></div>
          {/* ...Tus filas de movimientos aquí (como ya las tienes) ... */}
        </section>
      </main>

      <FooterBar onAdd={() => setSheet('add-txn')} />
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div>
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function FooterBar({ onAdd }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white/90 backdrop-blur">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-600">BudgetBuddy Web</div>
        <button className="btn-primary" onClick={onAdd}>Agregar movimiento</button>
      </div>
    </nav>
  );
}

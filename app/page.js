'use client';
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
const CategoryChart = dynamic(() => import('../components/CategoryChart'), { ssr: false });

// ----- Tipos simples -----
// Category { id, name, icon, color, isIncome }
// Txn { id, date(YYYY-MM-DD), amount(number), note, categoryId }
// Budget { year, month, amount }

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
  // Datos
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

  // Mes activo
  const [activeMonth, setActiveMonth] = useState(monthKey());
  const [sheet, setSheet] = useState(null); // 'add-txn' | 'add-cat' | 'set-budget' | {type:'edit-txn', id}

  const activeYearNum = Number(activeMonth.split('-')[0]);
  const activeMonthNum = Number(activeMonth.split('-')[1]);
  const start = startOfMonth(new Date(activeYearNum, activeMonthNum - 1, 1));
  const end = endOfMonth(new Date(activeYearNum, activeMonthNum - 1, 1));

  // Derivados
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

  // Acciones
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
        {/* Selector de mes */}
        <div className="flex items-center justify-center gap-2 py-4">
          <button className="pill" onClick={() => goMonth(-1)}>◀︎</button>
          <div className="font-medium">{new Date(activeYearNum, activeMonthNum - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
          <button className="pill" onClick={() => goMonth(1)}>▶︎</button>
        </div>

        {/* Resumen */}
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

        {/* Gráfico por categoría */}
        <section className="grid grid-cols-1 gap-4 mt-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2"><span>🍰</span><h2 className="font-semibold">Gasto por categoría</h2></div>
            {expenseByCat.length === 0 ? (
              <Empty text="Sin gastos en este mes" />
            ) : (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCat} dataKey="total" nameKey="name" innerRadius={50} outerRadius={80}>
                      {expenseByCat.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtMoney(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {expenseByCat.map((e, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: e.color }} />
                  <span className="grow">{e.name}</span>
                  <b>{fmtMoney(e.total)}</b>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Movimientos */}
        <section className="grid grid-cols-1 gap-2 mt-4 mb-24">
          <div className="flex items-center gap-2"><span>📋</span><h2 className="font-semibold">Movimientos del mes</h2></div>
          {monthTxns.length === 0 ? (
            <Empty text="Agrega tu primer ingreso o gasto" />
          ) : (
            monthTxns.map(tx => (
              <TxnRow key={tx.id} txn={tx} category={categories.find(c => c.id === tx.categoryId)} onEdit={() => setSheet({ type: 'edit-txn', id: tx.id })} onDelete={() => deleteTxn(tx.id)} />
            ))
          )}
        </section>
      </main>

      {/* Sheets */}
      {sheet === 'add-txn' && (
        <TxnSheet categories={categories} onClose={() => setSheet(null)} onSave={(payload) => { addTxn(payload); setSheet(null); }} />
      )}
      {sheet && typeof sheet === 'object' && sheet.type === 'edit-txn' && (
        <TxnSheet categories={categories} initial={txns.find(t => t.id === sheet.id)} onClose={() => setSheet(null)} onSave={(payload) => { updateTxn(sheet.id, payload); setSheet(null); }} />
      )}
      {sheet === 'add-cat' && (
        <CategorySheet onClose={() => setSheet(null)} onSave={(c) => { addCategory(c); setSheet(null); }} />
      )}
      {sheet === 'set-budget' && (
        <BudgetSheet year={activeYearNum} month={activeMonthNum} initial={monthBudget} onClose={() => setSheet(null)} onSave={(amount) => { setBudget(amount); setSheet(null); }} />
      )}

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
function Empty({ text }) { return <div className="card text-center text-gray-600">{text}</div>; }
function TxnRow({ txn, category, onEdit, onDelete }) {
  const isIncome = category?.isIncome;
  return (
    <div className="card flex items-center gap-3 justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: (category?.color || '#ddd') + '26' }}>
          <span>{category?.icon || '❓'}</span>
        </div>
        <div>
          <div className="font-medium">{category?.name || 'Sin categoría'}</div>
          <div className="text-xs text-gray-500">{txn.note || new Date(txn.date).toLocaleDateString()}</div>
        </div>
      </div>
      <div className={`font-semibold ${isIncome ? 'text-green-600' : ''}`}>{(isIncome ? '+' : '-') + fmtMoney(txn.amount)}</div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={onEdit}>Editar</button>
        <button className="btn" onClick={onDelete}>Eliminar</button>
      </div>
    </div>
  );
}

function TxnSheet({ categories, initial, onClose, onSave }) {
  const [date, setDate] = useState(initial?.date || todayISO());
  const [amount, setAmount] = useState(initial?.amount || 0);
  const [note, setNote] = useState(initial?.note || '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || (categories[0]?.id || ''));
  const canSave = amount > 0 && categoryId;
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{initial ? 'Editar movimiento' : 'Nuevo movimiento'}</h3>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">Fecha<input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <label className="grid gap-1 text-sm">Monto<input className="input" type="number" inputMode="decimal" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>
          <label className="grid gap-1 text-sm">Nota (opcional)<input className="input" value={note} onChange={e => setNote(e.target.value)} /></label>
          <label className="grid gap-1 text-sm">Categoría
            <select className="input" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name} {c.isIncome ? '(Ingreso)' : '(Gasto)'}</option>)}
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!canSave} onClick={() => onSave({ date, amount, note, categoryId })}>Guardar</button>
        </div>
      </div>
    </>
  );
}

function CategorySheet({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💼');
  const [color, setColor] = useState('#4F46E5');
  const [isIncome, setIsIncome] = useState(false);
  const canSave = name.trim().length > 0;
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Nueva categoría</h3>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">Nombre<input className="input" value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="grid gap-1 text-sm">Icono (emoji recomendado)<input className="input" value={icon} onChange={e => setIcon(e.target.value)} /></label>
          <label className="grid gap-1 text-sm">Color<input className="input" type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isIncome} onChange={e => setIsIncome(e.target.checked)} />Es ingreso (si no, gasto)</label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={!canSave} onClick={() => onSave({ name, icon, color, isIncome })}>Guardar</button>
        </div>
      </div>
    </>
  );
}

function BudgetSheet({ year, month, initial, onClose, onSave }) {
  const [amount, setAmount] = useState(initial || 0);
  return (
    <>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Presupuesto {new Date(year, month - 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">Monto<input className="input" type="number" inputMode="decimal" step="1" value={amount} onChange={e => setAmount(Number(e.target.value))} /></label>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={amount <= 0} onClick={() => onSave(amount)}>Guardar</button>
        </div>
      </div>
    </>
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


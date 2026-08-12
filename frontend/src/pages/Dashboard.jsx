import { useState, useEffect } from 'react';
import { dashboard } from '../services/api';
import { DollarSign, Receipt, AlertTriangle, ClipboardList, TrendingUp, TrendingDown, Wallet, CreditCard, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.get().then(({ data }) => { setData(data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-8">Cargando datos del dashboard...</div>;
  if (!data) return <div className="text-center py-8 text-red-500">Error al cargar el resumen</div>;

  const cards = [
    { label: 'Ventas del día', value: `$${Number(data?.ventas?.total_vendido || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-green-500' },
    { label: 'Tickets registrados', value: data?.ventas?.total_tickets || 0, icon: Receipt, color: 'bg-blue-500' },
    { label: 'Efectivo neto', value: `$${Number(data?.ventas?.efectivo_final || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'bg-emerald-600' },
    { label: 'Ventas Tarjeta', value: `$${Number(data?.ventas?.tarjeta_bruto || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: 'bg-indigo-500' },
    { label: 'Gastos del día', value: `$${Number(data?.ventas?.gastos || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'bg-yellow-500' },
    { label: 'Incidencias abiertas', value: data?.incidencias_abiertas || 0, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'Pendientes abiertos', value: data?.pendientes_abiertos || 0, icon: ClipboardList, color: 'bg-orange-500' },
  ];

  // Datos para gráficas del Dashboard
  const pieData = [
    { name: 'Efectivo Neto', value: Number(data.ventas.efectivo_final || 0), color: '#10B981' },
    { name: 'Tarjeta Terminal', value: Number(data.ventas.tarjeta_bruto || 0), color: '#3B82F6' },
    { name: 'Gastos de Sucursal', value: Number(data.ventas.gastos || 0), color: '#F59E0B' }
  ];

  const barData = [
    {
      concepto: 'Ingresos y Salidas del Día',
      'Efectivo Bruto': Number(data.ventas.efectivo_bruto || 0),
      'Tarjeta': Number(data.ventas.tarjeta_bruto || 0),
      'Gastos': Number(data.ventas.gastos || 0),
      'Efectivo Neto': Number(data.ventas.efectivo_final || 0)
    }
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Resumen Operativo del Día</h2>
        <p className="text-gray-500">{data.fecha} - Sucursal Fátima</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${card.color} text-white shrink-0`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className="text-lg font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECCIÓN DE GRÁFICAS VISUALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Donut de Composición del Ingreso */}
        <div className="card space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieIcon className="text-primary-600" size={20} /> Composición de Ingresos y Gastos
          </h3>
          <div className="h-64 relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-xs text-gray-400 block font-medium">Venta Total</span>
              <span className="text-base font-extrabold text-gray-800">${Number(data.ventas.total_vendido || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras de Flujo Financiero */}
        <div className="card space-y-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={20} /> Flujo en Caja Sucursal
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="concepto" hide />
                <YAxis />
                <Tooltip formatter={(val) => `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <Legend />
                <Bar dataKey="Efectivo Bruto" fill="#10B981" />
                <Bar dataKey="Tarjeta" fill="#3B82F6" />
                <Bar dataKey="Gastos" fill="#F59E0B" />
                <Bar dataKey="Efectivo Neto" fill="#059669" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
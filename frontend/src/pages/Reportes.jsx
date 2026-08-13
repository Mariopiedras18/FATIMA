import { useState, useEffect } from 'react';
import { reports } from '../services/api';
import { FileText, Download, TrendingUp, DollarSign, Wallet, CreditCard, PieChart as ChartIcon, Calendar } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

import { getTodayLocalDate } from '../utils/dateUtils';

const getThirtyDaysAgoLocalDate = () => {
  const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Reportes() {
  const [activeTab, setActiveTab] = useState('ventas');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    desde: getThirtyDaysAgoLocalDate(),
    hasta: getTodayLocalDate(),
    turno: '',
    folio_desde: '',
    folio_hasta: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { desde: filters.desde, hasta: filters.hasta };
      if (filters.turno) params.turno = filters.turno;
      if (filters.folio_desde) params.folio_desde = filters.folio_desde;
      if (filters.folio_hasta) params.folio_hasta = filters.folio_hasta;

      let result;
      switch (activeTab) {
        case 'ventas': result = await reports.ventas(params); break;
        case 'cortes': result = await reports.cortes(params); break;
        case 'gastos': result = await reports.gastos(params); break;
        case 'incidencias': result = await reports.incidencias(params); break;
        default: result = await reports.ventas(params);
      }
      setData(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const exportCSV = () => {
    if (!data.length) return;
    let csvContent = '';

    if (activeTab === 'ventas') {
      const headers = ['Fecha', 'Turno', 'Efectivo ($)', 'Tarjeta ($)', 'Total Ingresos ($)'];
      const rows = data.map(r => [
        r.fecha,
        r.turno === 'manana' ? 'Mañana' : 'Tarde',
        (r.efectivo || 0).toFixed(2),
        (r.tarjeta || 0).toFixed(2),
        (r.total || 0).toFixed(2)
      ]);
      csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      const headers = Object.keys(data[0]).filter(k => !k.includes('id') && typeof data[0][k] !== 'object').join(',');
      const rows = data.map(row => Object.entries(row).filter(([k, v]) => !k.includes('id') && typeof v !== 'object').map(([, v]) => `"${v}"`).join(',')).join('\n');
      csvContent = `${headers}\n${rows}`;
    }

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${activeTab}_${filters.desde}_a_${filters.hasta}.csv`;
    a.click();
  };

  const tabs = [
    { id: 'ventas', label: 'Ventas y Gráficos' },
    { id: 'cortes', label: 'Cortes & Gastos' },
    { id: 'gastos', label: 'Gastos Detallados' },
    { id: 'incidencias', label: 'Incidencias' }
  ];

  const formatCurrency = (val) => `$${Number(val || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Cálculos estadísticos y agregaciones para los gráficos
  const totalEfectivo = data.reduce((s, r) => s + Number(r.efectivo || r.total_efectivo_bruto || 0), 0);
  const totalTarjeta = data.reduce((s, r) => s + Number(r.tarjeta || r.total_tarjeta || 0), 0);
  const totalVendido = data.reduce((s, r) => s + Number(r.total || r.total_final || r.monto || 0), 0);
  const totalGastos = activeTab === 'cortes' ? data.reduce((s, r) => s + Number(r.total_gastos || 0), 0) : 0;

  // Formatear datos de ventas agrupándolos por semanas del mes
  const getWeeklyData = () => {
    if (activeTab !== 'ventas') return [];
    // Agrupar fechas en semanas
    const weeks = {};
    data.forEach(item => {
      const date = new Date(item.fecha);
      const year = date.getFullYear();
      const month = date.toLocaleString('es-MX', { month: 'short' });
      // Obtener el número de semana aproximado del mes (1 a 5)
      const weekNumber = Math.ceil(date.getDate() / 7);
      const weekKey = `Semana ${weekNumber} (${month})`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { name: weekKey, Efectivo: 0, Tarjeta: 0, Total: 0 };
      }
      weeks[weekKey].Efectivo += Number(item.efectivo || 0);
      weeks[weekKey].Tarjeta += Number(item.tarjeta || 0);
      weeks[weekKey].Total += Number(item.total || 0);
    });
    return Object.values(weeks).reverse();
  };

  const weeklyChartData = getWeeklyData();

  // Gráfica de Métodos de Pago
  const paymentPieData = [
    { name: 'Efectivo', value: totalEfectivo, color: '#10B981' },
    { name: 'Tarjeta', value: totalTarjeta, color: '#3B82F6' }
  ];

  // Gráfica de Tendencia de Ventas Diaria
  const dailyChartData = [...data].reverse().map(item => ({
    fecha: item.fecha,
    Efectivo: Number(item.efectivo || item.total_efectivo_bruto || 0),
    Tarjeta: Number(item.tarjeta || item.total_tarjeta || 0),
    Total: Number(item.total || item.total_final || 0)
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reportes e Indicadores</h2>
          <p className="text-gray-500 text-sm">Monitoreo de rendimiento comercial, gastos y cortes por periodo</p>
        </div>
        {data.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 shadow-sm">
            <Download size={18} /> Exportar CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-px overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setData([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full md:w-auto">
            <div>
              <label className="label">Desde Fecha</label>
              <div className="relative">
                <input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} className="input-field" />
              </div>
            </div>
            <div>
              <label className="label">Hasta Fecha</label>
              <input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} className="input-field" />
            </div>
            {activeTab === 'ventas' && (
              <>
                <div>
                  <label className="label">Folio Desde</label>
                  <input type="number" placeholder="Ej. 6" value={filters.folio_desde} onChange={(e) => setFilters({ ...filters, folio_desde: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="label">Folio Hasta</label>
                  <input type="number" placeholder="Ej. 9" value={filters.folio_hasta} onChange={(e) => setFilters({ ...filters, folio_hasta: e.target.value })} className="input-field" />
                </div>
              </>
            )}
            {activeTab !== 'cortes' && (
              <div>
                <label className="label">Turno</label>
                <select value={filters.turno} onChange={(e) => setFilters({ ...filters, turno: e.target.value })} className="input-field">
                  <option value="">Todos los turnos</option>
                  <option value="manana">Mañana</option>
                  <option value="tarde">Tarde</option>
                </select>
              </div>
            )}
          </div>
          <button onClick={loadData} className="btn-primary w-full md:w-auto px-6 py-2.5 flex items-center justify-center gap-2">
            <Calendar size={18} /> Filtrar Periodo
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100/50 border-green-200">
            <div>
              <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">Efectivo Acumulado</p>
              <p className="text-xl font-bold text-green-950 mt-1">{formatCurrency(totalEfectivo)}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg text-white"><Wallet size={20} /></div>
          </div>
          <div className="card flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200">
            <div>
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Tarjeta Acumulado</p>
              <p className="text-xl font-bold text-blue-950 mt-1">{formatCurrency(totalTarjeta)}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg text-white"><CreditCard size={20} /></div>
          </div>
          <div className="card flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 border-purple-200">
            <div>
              <p className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Total Ingresos</p>
              <p className="text-xl font-bold text-purple-950 mt-1">{formatCurrency(totalVendido)}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg text-white"><TrendingUp size={20} /></div>
          </div>
          {activeTab === 'cortes' && (
            <div className="card flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-yellow-200">
              <div>
                <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wider">Gastos en Cortes</p>
                <p className="text-xl font-bold text-yellow-950 mt-1">{formatCurrency(totalGastos)}</p>
              </div>
              <div className="p-3 bg-yellow-500 rounded-lg text-white"><DollarSign size={20} /></div>
            </div>
          )}
        </div>
      )}

      {/* Gráficas Dinámicas según la Pestaña Activa */}
      {data.length > 0 && activeTab === 'ventas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Tendencia Diaria */}
          <div className="card lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Tendencia Diaria por Turno</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="Total" stroke="#8884d8" strokeWidth={3} />
                  <Line type="monotone" dataKey="Efectivo" stroke="#10b981" />
                  <Line type="monotone" dataKey="Tarjeta" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico Tipo Donut de Métodos de Pago */}
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Distribución de Pagos</h3>
            <div className="h-60 relative flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center mt-[-10px]">
                <p className="text-xs text-gray-500">Total Venta</p>
                <p className="text-md font-bold text-gray-800">{formatCurrency(totalVendido)}</p>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras: Acumulado Semanal */}
          <div className="card lg:col-span-3 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Ventas Semanales a lo largo del Periodo</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="Efectivo" fill="#10b981" stackId="a" />
                  <Bar dataKey="Tarjeta" fill="#3b82f6" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráficas para Pestaña CORTES */}
      {data.length > 0 && activeTab === 'cortes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Comparativa de Cortes: Efectivo vs Gastos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.map(d => ({ fecha: `${d.fecha} (${d.turno === 'manana' ? 'M' : 'T'})`, Efectivo: d.total_efectivo_bruto, Gastos: d.total_gastos, Final: d.efectivo_final }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="Efectivo" fill="#10B981" />
                  <Bar dataKey="Gastos" fill="#F59E0B" />
                  <Bar dataKey="Final" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Diferencias de Caja por Corte</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.map(d => ({ fecha: `${d.fecha} (${d.turno === 'manana' ? 'M' : 'T'})`, Diferencia: d.diferencia_efectivo }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                  <Line type="monotone" dataKey="Diferencia" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Gráficas para Pestaña GASTOS */}
      {data.length > 0 && activeTab === 'gastos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Top Conceptos de Gastos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={Object.entries(data.reduce((acc, g) => { acc[g.concepto] = (acc[g.concepto] || 0) + Number(g.monto); return acc; }, {})).map(([concepto, monto]) => ({ concepto, monto })).sort((a, b) => b.monto - a.monto).slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="concepto" type="category" width={100} />
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Bar dataKey="monto" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Distribución por Turno de Gastos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Turno Mañana', value: data.filter(g => g.turno === 'manana').reduce((s, g) => s + Number(g.monto), 0), color: '#F59E0B' },
                      { name: 'Turno Tarde', value: data.filter(g => g.turno === 'tarde').reduce((s, g) => s + Number(g.monto), 0), color: '#D97706' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                  >
                    <Cell fill="#F59E0B" />
                    <Cell fill="#D97706" />
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tablas Detalladas */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Registros del Periodo</h3>
        <div className="overflow-x-auto">
          {loading ? <p className="text-center py-4">Cargando...</p> : data.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No se encontraron registros para los filtros seleccionados.</p>
            </div>
          ) : (
            <div>
              {activeTab === 'ventas' && (
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Turno</th>
                      <th className="px-4 py-3">Tickets</th>
                      <th className="px-4 py-3">Efectivo</th>
                      <th className="px-4 py-3">Tarjeta</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="table-cell">{r.fecha}</td>
                        <td className="table-cell capitalize">{r.turno === 'manana' ? 'Mañana' : 'Tarde'}</td>
                        <td className="table-cell">{r.tickets}</td>
                        <td className="table-cell text-green-600 font-medium">{formatCurrency(r.efectivo)}</td>
                        <td className="table-cell text-blue-600 font-medium">{formatCurrency(r.tarjeta)}</td>
                        <td className="table-cell font-semibold">{formatCurrency(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'cortes' && (
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Turno</th>
                      <th className="px-4 py-3">Efectivo Caja</th>
                      <th className="px-4 py-3">Tarjeta Terminal</th>
                      <th className="px-4 py-3">Gastos Restados</th>
                      <th className="px-4 py-3">Efectivo Final Real</th>
                      <th className="px-4 py-3">Diferencia</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="table-cell">{r.fecha}</td>
                        <td className="table-cell capitalize">{r.turno === 'manana' ? 'Mañana' : 'Tarde'}</td>
                        <td className="table-cell">{formatCurrency(r.total_efectivo_bruto)}</td>
                        <td className="table-cell">{formatCurrency(r.total_tarjeta)}</td>
                        <td className="table-cell text-yellow-600 font-medium">-{formatCurrency(r.total_gastos)}</td>
                        <td className="table-cell font-semibold">{formatCurrency(r.total_final)}</td>
                        <td className={`table-cell font-semibold ${Math.abs(r.diferencia_efectivo) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(r.diferencia_efectivo)}</td>
                        <td className="table-cell">
                          <span className={`badge ${r.estatus === 'cerrado' ? 'badge-success' : r.estatus === 'con_diferencia' ? 'badge-danger' : 'badge-warning'}`}>
                            {r.estatus === 'cerrado' ? 'Cerrado Sin Diferencia' : r.estatus === 'con_diferencia' ? 'Con Diferencia' : r.estatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'gastos' && (
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Turno</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Registró</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="table-cell">{r.fecha}</td>
                        <td className="table-cell capitalize">{r.turno === 'manana' ? 'Mañana' : 'Tarde'}</td>
                        <td className="table-cell">{r.concepto}</td>
                        <td className="table-cell font-semibold text-yellow-600">{formatCurrency(r.monto)}</td>
                        <td className="table-cell">{r.registrado_por_nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'incidencias' && (
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Prioridad</th>
                      <th className="px-4 py-3">Responsable</th>
                      <th className="px-4 py-3">Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="table-cell">{r.fecha}</td>
                        <td className="table-cell capitalize">{r.tipo?.replace('_', ' ')}</td>
                        <td className="table-cell max-w-xs truncate">{r.descripcion}</td>
                        <td className="table-cell"><span className={`badge ${r.prioridad === 'alta' ? 'badge-danger' : r.prioridad === 'media' ? 'badge-warning' : 'badge-info'}`}>{r.prioridad}</span></td>
                        <td className="table-cell">{r.responsable_nombre || '-'}</td>
                        <td className="table-cell"><span className={`badge ${r.estatus === 'resuelta' ? 'badge-success' : r.estatus === 'cancelada' ? 'bg-gray-100 text-gray-600' : 'badge-warning'}`}>{r.estatus?.replace('_', ' ')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                {data.length} registro(s) encontrado(s)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
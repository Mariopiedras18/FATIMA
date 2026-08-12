import { useState, useEffect } from 'react';
import { tickets } from '../services/api';
import { Plus, Trash2, Search } from 'lucide-react';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function Tickets() {
  const [list, setList] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fecha: getTodayLocalDate(),
    turno: 'manana',
    folio_4: '',
    monto_total: '',
    forma_pago: 'efectivo',
    monto_efectivo: '',
    monto_tarjeta: '',
    observaciones: ''
  });

  const loadData = async () => {
    try {
      const [ticketsRes, totalsRes] = await Promise.all([
        tickets.getAll({ fecha: form.fecha, turno: form.turno }),
        tickets.getTotals({ fecha: form.fecha, turno: form.turno })
      ]);
      setList(ticketsRes.data);
      setTotals(totalsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [form.fecha, form.turno]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tickets.create(form);
      setForm({ ...form, folio_4: '', monto_total: '', monto_efectivo: '', monto_tarjeta: '', observaciones: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este ticket?')) return;
    try {
      await tickets.delete(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const formaPagoLabel = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', combinado: 'Combinado', consumo_propio: 'Consumo Propio (Personal)' };
  const formaPagoBadge = { efectivo: 'badge-success', tarjeta: 'badge-info', combinado: 'badge-warning', consumo_propio: 'bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded text-xs' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registro Diario</h2>
          <p className="text-gray-500 text-sm">Captura de tickets por turno</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Ticket
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div>
          <label className="label">Fecha</label>
          <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="label">Turno</label>
          <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} className="input-field">
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
          </select>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Nuevo Ticket</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Folio (últimos 4 dígitos)</label>
              <input type="text" maxLength={4} pattern="\d{4}" value={form.folio_4} onChange={(e) => setForm({ ...form, folio_4: e.target.value })} className="input-field" placeholder="1234" required />
            </div>
            <div>
              <label className="label">Monto total</label>
              <input type="number" step="0.01" min="0.01" value={form.monto_total} onChange={(e) => setForm({ ...form, monto_total: e.target.value })} className="input-field" placeholder="0.00" required />
            </div>
            <div>
              <label className="label">Forma de pago</label>
              <select value={form.forma_pago} onChange={(e) => setForm({ ...form, forma_pago: e.target.value })} className="input-field">
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="combinado">Combinado</option>
                <option value="consumo_propio">Consumo Propio (Personal / Encargados)</option>
              </select>
            </div>
            {form.forma_pago === 'combinado' && (
              <>
                <div>
                  <label className="label">Monto efectivo</label>
                  <input type="number" step="0.01" min="0" value={form.monto_efectivo} onChange={(e) => setForm({ ...form, monto_efectivo: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="label">Monto tarjeta</label>
                  <input type="number" step="0.01" min="0" value={form.monto_tarjeta} onChange={(e) => setForm({ ...form, monto_tarjeta: e.target.value })} className="input-field" required />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="label">Observaciones</label>
              <input type="text" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="input-field" placeholder="Opcional (ej: Desayuno encargado)" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="card text-center p-3">
          <p className="text-xs text-gray-500">Tickets</p>
          <p className="text-xl font-bold">{totals.total_tickets || 0}</p>
        </div>
        <div className="card text-center p-3">
          <p className="text-xs text-gray-500">Efectivo</p>
          <p className="text-xl font-bold text-green-600">${Number(totals.efectivo_bruto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="card text-center p-3">
          <p className="text-xs text-gray-500">Tarjeta</p>
          <p className="text-xl font-bold text-blue-600">${Number(totals.tarjeta_bruto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="card text-center p-3">
          <p className="text-xs text-purple-600 font-semibold">Consumo Propio</p>
          <p className="text-xl font-bold text-purple-700">${Number(totals.consumo_propio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="card text-center p-3 col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500">Total vendido</p>
          <p className="text-xl font-bold text-primary-600">${Number(totals.total_vendido || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? <p className="text-center py-4">Cargando...</p> : list.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No hay tickets registrados para este turno</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Folio</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Forma de pago</th>
                <th className="px-4 py-3">Registró</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="table-cell font-mono">#{t.folio_4}</td>
                  <td className="table-cell font-semibold">${Number(t.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="table-cell">
                    <span className={`badge ${formaPagoBadge[t.forma_pago]}`}>{formaPagoLabel[t.forma_pago]}</span>
                  </td>
                  <td className="table-cell text-gray-500">{t.registrado_por_nombre}</td>
                  <td className="table-cell">
                    {!t.corte_id && (
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
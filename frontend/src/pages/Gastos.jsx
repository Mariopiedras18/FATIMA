import { useState, useEffect } from 'react';
import { expenses } from '../services/api';
import { Plus, Trash2 } from 'lucide-react';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function Gastos() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fecha: getTodayLocalDate(),
    turno: 'manana',
    concepto: '',
    monto: '',
    observacion: ''
  });

  const loadData = async () => {
    const { data } = await expenses.getAll({ fecha: form.fecha, turno: form.turno });
    setList(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [form.fecha, form.turno]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expenses.create(form);
      setForm({ ...form, concepto: '', monto: '', observacion: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try { await expenses.delete(id); loadData(); } catch (err) { alert(err.response?.data?.error); }
  };

  const total = list.reduce((sum, e) => sum + Number(e.monto), 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gastos de Sucursal</h2>
          <p className="text-gray-500 text-sm">Se descuentan del efectivo</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Gasto
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Registrar Gasto</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <label className="label">Concepto</label>
              <input type="text" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} className="input-field" placeholder="Ej. Compra de servilletas" required />
            </div>
            <div>
              <label className="label">Monto</label>
              <input type="number" step="0.01" min="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} className="input-field" required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Observación</label>
              <input type="text" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} className="input-field" placeholder="Opcional" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

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

      <div className="card mb-4">
        <p className="text-sm text-gray-500">Total gastos del turno: <span className="text-xl font-bold text-yellow-600">${Number(total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span></p>
      </div>

      <div className="card overflow-x-auto">
        {loading ? <p className="text-center py-4">Cargando...</p> : list.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No hay gastos registrados</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Registró</th>
                <th className="px-4 py-3">Observación</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t border-gray-100">
                  <td className="table-cell">{e.concepto}</td>
                  <td className="table-cell font-semibold text-yellow-600">${Number(e.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className="table-cell text-gray-500">{e.registrado_por_nombre}</td>
                  <td className="table-cell text-gray-500">{e.observacion || '-'}</td>
                  <td className="table-cell">
                    {!e.cash_cut_id && (
                      <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
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
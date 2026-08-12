import { useState, useEffect } from 'react';
import { improvements } from '../services/api';
import { Plus, Edit2 } from 'lucide-react';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function Mejoras() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fecha: getTodayLocalDate(),
    categoria: 'procesos_internos',
    descripcion: '',
    beneficio: '',
    prioridad: 'media'
  });

  const loadData = async () => {
    const { data } = await improvements.getAll();
    setList(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await improvements.create(form);
      setForm({ fecha: new Date().toISOString().split('T')[0], categoria: 'procesos_internos', descripcion: '', beneficio: '', prioridad: 'media' });
      setShowForm(false);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleStatus = async (id, estatus) => {
    await improvements.update(id, { estatus });
    loadData();
  };

  const cats = { eventos: 'Eventos', atencion_cliente: 'Atención al cliente', tiempos_atencion: 'Tiempos de atención', procesos_internos: 'Procesos internos', limpieza_orden: 'Limpieza y orden', comunicacion_interna: 'Comunicación interna', capacitacion: 'Capacitacion', seguimiento_pendientes: 'Seguimiento', reduccion_errores: 'Reducción de errores', control_diario: 'Control diario' };
  const prioridadBadge = { baja: 'badge-info', media: 'badge-warning', alta: 'badge-danger' };
  const estatusBadge = { propuesta: 'badge-info', en_revision: 'badge-warning', aprobada: 'badge-success', en_proceso: 'bg-purple-100 text-purple-800', implementada: 'bg-green-100 text-green-800', descartada: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Oportunidades de Mejora</h2>
          <p className="text-gray-500 text-sm">Ideas internas de mejora</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva Mejora
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Registrar Mejora</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha</label>
              <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="input-field">
                {Object.entries(cats).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })} className="input-field">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows={3} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Beneficio esperado</label>
              <input type="text" value={form.beneficio} onChange={(e) => setForm({ ...form, beneficio: e.target.value })} className="input-field" placeholder="Opcional" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? <p className="text-center py-4">Cargando...</p> : list.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No hay mejoras registradas</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="table-cell">{m.fecha}</td>
                  <td className="table-cell">{cats[m.categoria]}</td>
                  <td className="table-cell max-w-xs truncate">{m.descripcion}</td>
                  <td className="table-cell"><span className={`badge ${prioridadBadge[m.prioridad]}`}>{m.prioridad}</span></td>
                  <td className="table-cell"><span className={`badge ${estatusBadge[m.estatus]}`}>{m.estatus.replace('_', ' ')}</span></td>
                  <td className="table-cell">
                    <select onChange={(e) => handleStatus(m.id, e.target.value)} className="text-xs border rounded px-2 py-1">
                      <option value="">Cambiar...</option>
                      <option value="propuesta">Propuesta</option>
                      <option value="en_revision">En revisión</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="implementada">Implementada</option>
                      <option value="descartada">Descartada</option>
                    </select>
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
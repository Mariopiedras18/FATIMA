import { useState, useEffect } from 'react';
import { assets } from '../services/api';
import { Plus, Edit2 } from 'lucide-react';

export default function Equipo() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '', tipo: 'mobiliario', descripcion: '', estado_actual: 'regular', accion_requerida: 'revisar', prioridad: 'media', costo_estimado: ''
  });

  const loadData = async () => {
    const { data } = await assets.getAll();
    setList(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assets.create(form);
      setForm({ nombre: '', tipo: 'mobiliario', descripcion: '', estado_actual: 'regular', accion_requerida: 'revisar', prioridad: 'media', costo_estimado: '' });
      setShowForm(false);
      loadData();
    } catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const handleStatus = async (id, estatus) => {
    await assets.update(id, { estatus });
    loadData();
  };

  const tipoLabel = { mobiliario: 'Mobiliario', equipo: 'Equipo', caja: 'Caja', refrigeracion: 'Refrigeración', limpieza: 'Limpieza', infraestructura: 'Infraestructura', otro: 'Otro' };
  const estadoLabel = { bueno: 'Bueno', regular: 'Regular', danado: 'Dañado', fuera_servicio: 'Fuera de servicio', requires_cambio: 'Requiere cambio' };
  const accionLabel = { revisar: 'Revisar', reparar: 'Reparar', renovar: 'Renovar', comprar: 'Comprar', dar_baja: 'Dar de baja' };
  const prioridadBadge = { baja: 'badge-info', media: 'badge-warning', alta: 'badge-danger' };
  const estatusBadge = { reportado: 'badge-warning', en_revision: 'badge-info', en_proceso: 'bg-purple-100 text-purple-800', resuelto: 'badge-success', cancelado: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mobiliario y Equipo</h2>
          <p className="text-gray-500 text-sm">Control de equipos por atender</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Registro
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Registrar Equipo/Mobiliario</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre</label>
              <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input-field" placeholder="Ej. Refrigerador" required />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input-field">
                {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado actual</label>
              <select value={form.estado_actual} onChange={(e) => setForm({ ...form, estado_actual: e.target.value })} className="input-field">
                <option value="bueno">Bueno</option>
                <option value="regular">Regular</option>
                <option value="danado">Dañado</option>
                <option value="fuera_servicio">Fuera de servicio</option>
                <option value="requiere_cambio">Requiere cambio</option>
              </select>
            </div>
            <div>
              <label className="label">Acción requerida</label>
              <select value={form.accion_requerida} onChange={(e) => setForm({ ...form, accion_requerida: e.target.value })} className="input-field">
                {Object.entries(accionLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <div>
              <label className="label">Costo estimado</label>
              <input type="number" step="0.01" min="0" value={form.costo_estimado} onChange={(e) => setForm({ ...form, costo_estimado: e.target.value })} className="input-field" placeholder="Opcional" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Descripción</label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input-field" rows={2} required />
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
          <p className="text-center py-8 text-gray-500">No hay registros</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="table-cell font-medium">{a.nombre}</td>
                  <td className="table-cell">{tipoLabel[a.tipo]}</td>
                  <td className="table-cell">{a.estado_actual}</td>
                  <td className="table-cell">{accionLabel[a.accion_requerida]}</td>
                  <td className="table-cell"><span className={`badge ${prioridadBadge[a.prioridad]}`}>{a.prioridad}</span></td>
                  <td className="table-cell"><span className={`badge ${estatusBadge[a.estatus]}`}>{a.estatus.replace('_', ' ')}</span></td>
                  <td className="table-cell">
                    <select onChange={(e) => handleStatus(a.id, e.target.value)} className="text-xs border rounded px-2 py-1">
                      <option value="">Cambiar...</option>
                      <option value="reportado">Reportado</option>
                      <option value="en_revision">En revisión</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="resuelto">Resuelto</option>
                      <option value="cancelado">Cancelado</option>
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
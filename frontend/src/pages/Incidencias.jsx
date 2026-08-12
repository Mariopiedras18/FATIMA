import { useState, useEffect } from 'react';
import { incidents } from '../services/api';
import { Plus, Edit2 } from 'lucide-react';
import { getTodayLocalDate } from '../utils/dateUtils';

export default function Incidencias() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    fecha: getTodayLocalDate(),
    turno: 'manana',
    tipo: 'operacion',
    descripcion: '',
    prioridad: 'media',
    fecha_compromiso: ''
  });

  const loadData = async () => {
    const { data } = await incidents.getAll();
    setList(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await incidents.update(editItem.id, form);
      } else {
        await incidents.create(form);
      }
      setForm({ fecha: new Date().toISOString().split('T')[0], turno: 'manana', tipo: 'operacion', descripcion: '', prioridad: 'media', fecha_compromiso: '' });
      setShowForm(false);
      setEditItem(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  const handleEdit = (item) => {
    setForm({ fecha: item.fecha, turno: item.turno, tipo: item.tipo, descripcion: item.descripcion, prioridad: item.prioridad, fecha_compromiso: item.fecha_compromiso || '' });
    setEditItem(item);
    setShowForm(true);
  };

  const handleStatus = async (id, estatus) => {
    await incidents.update(id, { estatus });
    loadData();
  };

  const tipoLabel = { caja: 'Caja', operacion: 'Operación', atencion_cliente: 'Atención al cliente', sistema: 'Sistema', limpieza: 'Limpieza', equipo: 'Equipo', otro: 'Otro' };
  const prioridadBadge = { baja: 'badge-info', media: 'badge-warning', alta: 'badge-danger' };
  const estatusBadge = { pendiente: 'badge-warning', en_proceso: 'badge-info', resuelta: 'badge-success', cancelada: 'bg-gray-100 text-gray-600' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Incidencias</h2>
          <p className="text-gray-500 text-sm">Problemas de la sucursal</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditItem(null); setForm({ fecha: new Date().toISOString().split('T')[0], turno: 'manana', tipo: 'operacion', descripcion: '', prioridad: 'media', fecha_compromiso: '' }); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva Incidencia
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">{editItem ? 'Editar' : 'Nueva'} Incidencia</h3>
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
              <label className="label">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="input-field">
                {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
            <div>
              <label className="label">Fecha compromiso</label>
              <input type="date" value={form.fecha_compromiso} onChange={(e) => setForm({ ...form, fecha_compromiso: e.target.value })} className="input-field" />
            </div>
            <div className="flex items-end gap-3">
              <button type="submit" className="btn-primary">{editItem ? 'Actualizar' : 'Guardar'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditItem(null); }} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-x-auto">
        {loading ? <p className="text-center py-4">Cargando...</p> : list.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No hay incidencias registradas</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} className="border-t border-gray-100">
                  <td className="table-cell">{i.fecha}</td>
                  <td className="table-cell">{tipoLabel[i.tipo]}</td>
                  <td className="table-cell max-w-xs truncate">{i.descripcion}</td>
                  <td className="table-cell"><span className={`badge ${prioridadBadge[i.prioridad]}`}>{i.prioridad}</span></td>
                  <td className="table-cell"><span className={`badge ${estatusBadge[i.estatus]}`}>{i.estatus.replace('_', ' ')}</span></td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(i)} className="text-blue-500 hover:text-blue-700"><Edit2 size={16} /></button>
                      {i.estatus !== 'resuelta' && i.estatus !== 'cancelada' && (
                        <select onChange={(e) => handleStatus(i.id, e.target.value)} className="text-xs border rounded px-2 py-1">
                          <option value="">Cambiar...</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="resuelta">Resuelta</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      )}
                    </div>
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
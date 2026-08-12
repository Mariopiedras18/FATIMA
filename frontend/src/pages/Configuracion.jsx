import { useState, useEffect } from 'react';
import { auth } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, Edit2, Save, KeyRound, ShieldCheck, UserCheck, Lock } from 'lucide-react';

export default function Configuracion() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: 'cajero' });

  const loadUsers = async () => {
    try {
      const { data } = await auth.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanNombre = form.nombre.trim();
    const cleanUsuario = form.usuario.trim().toLowerCase();

    try {
      if (editUser) {
        await auth.updateUser(editUser.id, { nombre: cleanNombre, rol: form.rol });
      } else {
        const usernameExists = users.some(u => (u.usuario || u.username || '').trim().toLowerCase() === cleanUsuario);
        if (usernameExists) {
          alert(`El nombre de usuario "${cleanUsuario}" ya existe en la lista de usuarios. Por favor escribe un nombre de usuario diferente (ejemplo: ${cleanUsuario}2 o ${cleanUsuario}_fatima).`);
          return;
        }
        await auth.createUser({
          nombre: cleanNombre,
          usuario: cleanUsuario,
          password: form.password,
          rol: form.rol
        });
      }
      setForm({ nombre: '', usuario: '', password: '', rol: 'encargado' });
      setShowForm(false);
      setEditUser(null);
      loadUsers();
      alert('¡Usuario guardado con éxito!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (u) => {
    setForm({ nombre: u.nombre, usuario: u.usuario || u.username, password: '', rol: u.rol });
    setEditUser(u);
    setShowForm(true);
  };

  const rolLabel = { admin: 'Administrador (Acceso Total)', encargado: 'Encargado de Sucursal', cajero: 'Cajero / Operativo' };
  const rolBadge = { admin: 'badge-danger', encargado: 'badge-warning', cajero: 'badge-info', operativo: 'badge-info' };

  if (user?.rol !== 'admin') {
    return (
      <div className="card text-center py-12">
        <Lock size={48} className="mx-auto text-rose-700 mb-3" />
        <h3 className="text-lg font-bold text-[#2C1A1D]">Acceso Restringido</h3>
        <p className="text-sm font-semibold text-slate-500 mt-1">Solo la administración puede gestionar credenciales y usuarios del sistema.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#2C1A1D]">Gestión de Credenciales & Usuarios</h2>
          <p className="text-sm font-semibold text-[#8C5A32]">Administración de accesos y permisos por rol</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditUser(null);
            setForm({ nombre: '', usuario: '', password: '', rol: 'encargado' });
          }}
          className="btn-primary"
        >
          <Plus size={18} /> Crear Nuevas Credenciales
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h3 className="text-lg font-bold font-serif text-[#2C1A1D] flex items-center gap-2">
            <KeyRound size={20} className="text-[#D97706]" />
            {editUser ? 'Editar Permisos del Usuario' : 'Crear Nuevas Credenciales de Acceso'}
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre Completo del Personal</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input-field"
                placeholder="ej. Carlos Mendoza"
                required
              />
            </div>

            {!editUser && (
              <>
                <div>
                  <label className="label">Nombre de Usuario (Para Iniciar Sesión)</label>
                  <input
                    type="text"
                    value={form.usuario}
                    onChange={(e) => setForm({ ...form, usuario: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    className="input-field"
                    placeholder="ej. carlos"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Ingresa minúsculas sin espacios. Ejemplo: <i>carlos</i>, <i>maria_fatima</i>, <i>encargado2</i></p>
                </div>

                <div>
                  <label className="label">Contraseña Inicial</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="label">Rol / Nivel de Acceso</label>
              <select
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
                className="input-field"
              >
                <option value="encargado">Encargado de Sucursal (Acceso Operativo: Tickets, Cortes, Gastos, Pendientes)</option>
                <option value="admin">Administrador (Acceso Total: Dashboard, Reportes y Credenciales)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" className="btn-primary">
                <Save size={16} /> {editUser ? 'Guardar Cambios' : 'Registrar Credenciales'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA DE USUARIOS ACTIVOS */}
      <div className="card overflow-x-auto">
        <h3 className="text-base font-bold font-serif text-[#2C1A1D] mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#8C5A32]" /> Credenciales Registradas en el Sistema
        </h3>

        {loading ? (
          <p className="text-center py-6 text-sm text-[#8C5A32]">Cargando usuarios...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nivel de Acceso / Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[#F4EDE2]">
                  <td className="table-cell font-bold text-[#2C1A1D]">{u.nombre}</td>
                  <td className="table-cell font-mono text-xs text-slate-600">{u.usuario}</td>
                  <td className="table-cell">
                    <span className={`badge ${rolBadge[u.rol] || 'badge-info'}`}>
                      {rolLabel[u.rol] || u.rol}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${u.activo ? 'badge-success' : 'bg-gray-100 text-gray-600'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <button onClick={() => handleEdit(u)} className="btn-secondary text-xs py-1 px-3">
                      <Edit2 size={14} /> Editar Rol
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card bg-[#FDFBF7] border-[#EBE3D5]">
        <h3 className="text-sm font-bold font-serif text-[#2C1A1D] mb-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#1E5631]" /> Control de Seguridad & Permisos
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Los usuarios con rol <b>Cajero / Operativo</b> únicamente tienen acceso al <i>Registro Diario de Tickets</i>, <i>Cortes de Caja</i>, <i>Gastos</i> y el <i>Roll de Limpieza/Pendientes</i>.
          Los apartados de <b>Inicio (Dashboard)</b>, <b>Reportes Financieros</b> y <b>Configuración de Credenciales</b> están estrictamente restringidos para el nivel de <b>Administrador</b>.
        </p>
      </div>
    </div>
  );
}
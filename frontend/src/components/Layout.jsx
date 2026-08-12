import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { LayoutDashboard, Receipt, Wallet, AlertTriangle, Lightbulb, Wrench, ClipboardList, BarChart3, Settings, LogOut, Menu, X, FileText, Coffee, UserCheck, KeyRound, Save, Edit3, User } from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Inicio', icon: LayoutDashboard, adminOnly: true },
  { path: '/tickets', label: 'Registro Diario', icon: Receipt },
  { path: '/cortes', label: 'Corte de Caja', icon: Wallet },
  { path: '/gastos', label: 'Gastos', icon: BarChart3 },
  { path: '/incidencias', label: 'Incidencias', icon: AlertTriangle },
  { path: '/mejoras', label: 'Mejoras', icon: Lightbulb },
  { path: '/equipo', label: 'Mobiliario/Equipo', icon: Wrench },
  { path: '/pendientes', label: 'Pendientes', icon: ClipboardList },
  { path: '/reportes', label: 'Reportes', icon: FileText, adminOnly: true },
  { path: '/configuracion', label: 'Configuración', icon: Settings, adminOnly: true },
];

export default function Layout({ children }) {
  const { user, logout, updateUserData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ nombre: '', usuario: '', password: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || user?.rol === 'admin');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openProfileModal = () => {
    setProfileForm({
      nombre: user?.nombre || '',
      usuario: user?.usuario || user?.username || '',
      password: ''
    });
    setShowProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.nombre.trim()) {
      alert('El nombre completo es requerido');
      return;
    }
    if (!profileForm.usuario.trim()) {
      alert('El usuario es requerido');
      return;
    }

    setSavingProfile(true);
    try {
      const cleanUser = profileForm.usuario.trim().toLowerCase().replace(/\s+/g, '');
      const updatePayload = {
        nombre: profileForm.nombre.trim(),
        usuario: cleanUser
      };
      if (profileForm.password.trim()) {
        updatePayload.password = profileForm.password.trim();
      }

      await auth.updateUser(user.id, updatePayload);
      updateUserData({
        nombre: profileForm.nombre.trim(),
        usuario: cleanUser
      });
      setShowProfileModal(false);
      alert('¡Tus datos de perfil y contraseña han sido actualizados con éxito!');
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F6F0E6]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-[#1F120A]/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* LATERAL EN CAFÉ ESPRESSO ROBUSTO CON SOMBRAS DE PROFUNDIDAD */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#2C1A1D] text-[#FDFBF7] shadow-[4px_0_24px_rgba(44,26,29,0.2)] transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col justify-center px-6 h-20 bg-[#211316] border-b border-[#3D2428] shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#D97706] text-white rounded-lg shadow-sm">
              <Coffee size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold font-serif tracking-wide text-[#FFFDF9] drop-shadow-xs">Tutti Bocado</h1>
              <span className="text-[10px] text-[#F59E0B] tracking-widest uppercase font-bold">Sucursal Fátima</span>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive 
                    ? 'bg-[#8C5A32] text-[#FFFDF9] shadow-[0_4px_12px_rgba(140,90,50,0.35)] border-l-4 border-[#F59E0B]' 
                    : 'text-[#E5D6C0]/80 hover:bg-[#3D2428] hover:text-[#FFFDF9]'
                }`}
              >
                <Icon size={19} className={isActive ? 'text-[#FDE68A]' : 'text-[#D2B998]/60'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#3D2428] bg-[#211316]">
          <div className="flex items-center gap-3 mb-2 p-2.5 rounded-xl bg-[#2C1A1D] border border-[#3D2428]">
            <div className="w-9 h-9 bg-[#D97706] text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md shrink-0">
              {user?.nombre?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#FFFDF9] truncate">{user?.nombre}</p>
              <p className="text-xs font-semibold text-[#F59E0B] capitalize">{user?.rol}</p>
            </div>
            <button
              onClick={openProfileModal}
              title="Editar mi contraseña y datos de perfil"
              className="p-1.5 text-[#D2B998]/80 hover:text-white hover:bg-[#3D2428] rounded-lg transition-colors"
            >
              <Edit3 size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={openProfileModal}
              className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] hover:text-[#FBBF24] transition-colors"
            >
              <User size={14} />
              Mi Perfil
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D2B998]/70 hover:text-rose-400 transition-colors"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen flex flex-col">
        {/* ENCABEZADO SUPERIOR CON SOMBRA CAFÉ */}
        <header className="sticky top-0 z-20 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#E6DCCF] px-6 py-3.5 flex items-center justify-between shadow-[0_4px_16px_rgba(61,35,20,0.06)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-[#EFE6D5] rounded-xl text-[#2C1A1D]">
              <Menu size={22} />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#2C1A1D]">
              {menuItems.find(m => m.path === location.pathname)?.label || 'Sistema Fátima'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 text-xs font-bold text-[#8C5A32] bg-[#F0E6D5] hover:bg-[#E6D8C3] border border-[#D9CBBA] px-3 py-1.5 rounded-xl transition-all shadow-xs"
            >
              <UserCheck size={15} className="text-[#D97706]" />
              <span>{user?.nombre}</span>
              <span className="text-[10px] text-gray-500 font-normal">({user?.rol})</span>
            </button>
            <div className="text-xs font-bold text-[#3D2314] bg-[#F0E6D5] border border-[#D9CBBA] px-3.5 py-1.5 rounded-xl shadow-xs hidden sm:block">
              📍 Sucursal Fátima
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* MODAL CONFIGURAR MI PERFIL Y CONTRASEÑA */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold font-serif text-[#2C1A1D] flex items-center gap-2">
                <KeyRound size={20} className="text-[#D97706]" />
                Mi Perfil y Contraseña
              </h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="label">Tu Nombre Completo</label>
                <input
                  type="text"
                  value={profileForm.nombre}
                  onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div>
                <label className="label">Nombre de Usuario (Para Iniciar Sesión)</label>
                <input
                  type="text"
                  value={profileForm.usuario}
                  onChange={(e) => setProfileForm({ ...profileForm, usuario: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="input-field"
                  placeholder="ej. carlos"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Minúsculas sin espacios. Este es el nombre con el que inicias sesión.</p>
              </div>

              <div>
                <label className="label">Nueva Contraseña (Opcional)</label>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                  className="input-field"
                  placeholder="Dejar en blanco para mantener la actual"
                />
                <p className="text-xs text-slate-400 mt-1">Si no deseas cambiar tu contraseña actual, déjala vacía.</p>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="submit" disabled={savingProfile} className="btn-primary flex-1 flex justify-center items-center gap-2">
                  <Save size={16} />
                  {savingProfile ? 'Guardando...' : 'Actualizar Mis Datos'}
                </button>
                <button type="button" onClick={() => setShowProfileModal(false)} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Coffee } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F0E6] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2C1A1D] text-[#D97706] rounded-2xl shadow-[0_10px_25px_rgba(44,26,29,0.3)] mb-4 border border-[#3D2428]">
            <Coffee size={36} />
          </div>
          <h1 className="text-3xl font-bold font-serif text-[#2C1A1D] tracking-wide">Tutti Bocado</h1>
          <p className="text-xs font-bold text-[#8C5A32] tracking-widest uppercase mt-1">Sucursal Fátima</p>
        </div>

        <div className="card shadow-[0_15px_35px_-5px_rgba(61,35,20,0.15)] border-[#E6DCCF]">
          <h2 className="text-xl font-bold font-serif text-[#2C1A1D] mb-6 flex items-center gap-2">
            <LogIn size={20} className="text-[#D97706]" />
            Iniciar Sesión
          </h2>
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="input-field"
                placeholder="Tu nombre de usuario"
                required
              />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
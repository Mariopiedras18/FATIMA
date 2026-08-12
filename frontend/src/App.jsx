import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Cortes from './pages/Cortes';
import Gastos from './pages/Gastos';
import Incidencias from './pages/Incidencias';
import Mejoras from './pages/Mejoras';
import Equipo from './pages/Equipo';
import Pendientes from './pages/Pendientes';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F6F0E6] font-semibold text-[#8C5A32]">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.rol !== 'admin') {
    return <Navigate to="/tickets" />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth() || {};
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F6F0E6] font-semibold text-[#8C5A32]">Cargando...</div>;
  return user ? <Navigate to={user.rol === 'admin' ? "/" : "/tickets"} /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute adminOnly={true}><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/tickets" element={<PrivateRoute><Layout><Tickets /></Layout></PrivateRoute>} />
          <Route path="/cortes" element={<PrivateRoute><Layout><Cortes /></Layout></PrivateRoute>} />
          <Route path="/gastos" element={<PrivateRoute><Layout><Gastos /></Layout></PrivateRoute>} />
          <Route path="/incidencias" element={<PrivateRoute><Layout><Incidencias /></Layout></PrivateRoute>} />
          <Route path="/mejoras" element={<PrivateRoute><Layout><Mejoras /></Layout></PrivateRoute>} />
          <Route path="/equipo" element={<PrivateRoute><Layout><Equipo /></Layout></PrivateRoute>} />
          <Route path="/pendientes" element={<PrivateRoute><Layout><Pendientes /></Layout></PrivateRoute>} />
          <Route path="/reportes" element={<PrivateRoute adminOnly={true}><Layout><Reportes /></Layout></PrivateRoute>} />
          <Route path="/configuracion" element={<PrivateRoute adminOnly={true}><Layout><Configuracion /></Layout></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
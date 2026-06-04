// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import Login       from './pages/Login';
import Catalogo    from './pages/Catalogo';
import Assinaturas from './pages/Assinaturas';
import ClienteLayout from './components/ClienteLayout';
import AdminLayout   from './components/AdminLayout';
import Dashboard   from './pages/admin/Dashboard';
import Pedidos     from './pages/admin/Pedidos';
import Produtos    from './pages/admin/Produtos';
import Zonas       from './pages/admin/Zonas';
import Assinantes  from './pages/admin/Assinantes';

function PrivateRoute({ children }) {
  const { logado } = useAuth();
  return logado ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Área do cliente */}
          <Route path="/" element={<PrivateRoute><ClienteLayout /></PrivateRoute>}>
            <Route index element={<Catalogo />} />
            <Route path="assinaturas" element={<Assinaturas />} />
          </Route>

          {/* Painel admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos"    element={<Pedidos />} />
            <Route path="produtos"   element={<Produtos />} />
            <Route path="zonas"      element={<Zonas />} />
            <Route path="assinantes" element={<Assinantes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

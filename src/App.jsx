// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import Login               from './pages/Login';
import LoginAdmin          from './pages/LoginAdmin';
import Catalogo            from './pages/Catalogo';
import Assinaturas         from './pages/Assinaturas';
import ConfirmarAssinatura from './pages/ConfirmarAssinatura';
import MeusPedidos         from './pages/MeusPedidos';
import EditarAssinatura    from './pages/EditarAssinatura';
import MeuPerfil           from './pages/MeuPerfil';
import ClienteLayout       from './components/ClienteLayout';
import AdminLayout         from './components/AdminLayout';
import Dashboard           from './pages/admin/Dashboard';
import Pedidos             from './pages/admin/Pedidos';
import EditarPedido        from './pages/admin/EditarPedido';
import Produtos            from './pages/admin/Produtos';
import Categorias          from './pages/admin/Categorias';
import Zonas               from './pages/admin/Zonas';
import Assinantes          from './pages/admin/Assinantes';
import AssinaturasAdmin    from './pages/admin/Assinaturas';
import Estoque7Dias        from './pages/admin/Estoque7Dias';

function RotaCliente({ children }) {
  const { logado, isAdmin } = useAuth();
  if (!logado) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/painel" replace />;
  return children;
}

function RotaAdmin({ children }) {
  const { logado, isAdmin } = useAuth();
  if (!logado) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"       element={<Login />} />
          <Route path="/admin/login" element={<LoginAdmin />} />

          <Route path="/" element={<RotaCliente><ClienteLayout /></RotaCliente>}>
            <Route index                     element={<Catalogo />} />
            <Route path="assinaturas"        element={<Assinaturas />} />
            <Route path="assinaturas/:id/editar" element={<EditarAssinatura />} />
            <Route path="pedidos"            element={<MeusPedidos />} />
            <Route path="assinar"            element={<ConfirmarAssinatura />} />
            <Route path="perfil"             element={<MeuPerfil />} />
          </Route>

          <Route path="/painel" element={<RotaAdmin><AdminLayout /></RotaAdmin>}>
            <Route index                     element={<Dashboard />} />
            <Route path="pedidos"            element={<Pedidos />} />
            <Route path="pedidos/:id/editar" element={<EditarPedido />} />
            <Route path="estoque7dias"       element={<Estoque7Dias />} />
            <Route path="produtos"           element={<Produtos />} />
            <Route path="categorias"         element={<Categorias />} />
            <Route path="zonas"              element={<Zonas />} />
            <Route path="assinantes"         element={<Assinantes />} />
            <Route path="assinaturas"        element={<AssinaturasAdmin />} />
          </Route>

          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
          <Route path="*"      element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// src/components/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '/painel',              label: 'Dashboard',       icon: '📊', end: true },
  { to: '/painel/pedidos',      label: 'Pedidos',         icon: '📦' },
  { to: '/painel/proximos7dias',label: 'Próx. 7 dias',    icon: '📅' },
  { to: '/painel/estoque7dias', label: 'Estoque 7 dias',  icon: '📊' },
  { to: '/painel/produtos',     label: 'Produtos',        icon: '🛒' },
  { to: '/painel/categorias',   label: 'Categorias',      icon: '🏷️' },
  { to: '/painel/zonas',        label: 'Zonas CEP',       icon: '📍' },
  { to: '/painel/assinantes',   label: 'Assinantes',      icon: '👥' },
];

export default function AdminLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() { sair(); navigate('/admin/login'); }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>⚙️</span>
          <span className={styles.brandName}>Admin</span>
        </div>
        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
            >
              <span>{icon}</span><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          {usuario && <div className={styles.adminNome}>{usuario.nome}</div>}
          <button className={styles.voltarBtn} onClick={handleSair}>← Sair</button>
        </div>
      </aside>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}

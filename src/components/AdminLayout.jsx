// src/components/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styles from './AdminLayout.module.css';

const NAV = [
  { to: '/admin',          label: 'Dashboard',  icon: '📊', end: true },
  { to: '/admin/pedidos',  label: 'Pedidos',    icon: '📦' },
  { to: '/admin/produtos', label: 'Produtos',   icon: '🛒' },
  { to: '/admin/zonas',    label: 'Zonas CEP',  icon: '📍' },
  { to: '/admin/assinantes', label: 'Assinantes', icon: '👥' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
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
        <button className={styles.voltarBtn} onClick={() => navigate('/login')}>← Sair</button>
      </aside>
      <main className={styles.main}><Outlet /></main>
    </div>
  );
}

// src/components/ClienteLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './ClienteLayout.module.css';

const NAV = [
  { to: '/',           label: 'Catálogo',          icon: '🛒' },
  { to: '/assinaturas', label: 'Assinaturas',      icon: '🔄' },
  { to: '/pedidos',    label: 'Meus pedidos',       icon: '📦' },
];

export default function ClienteLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function handleSair() { sair(); navigate('/login'); }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🌿</span>
          <span className={styles.brandName}>AssínaSaas</span>
        </div>
        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{usuario?.nome?.[0]?.toUpperCase()}</div>
            <div className={styles.userName}>{usuario?.nome}</div>
          </div>
          <button className={styles.sairBtn} onClick={handleSair}>Sair</button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

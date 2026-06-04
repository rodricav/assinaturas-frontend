// src/components/ui/index.jsx
import styles from './ui.module.css';

export function Button({ children, variant = 'primary', size = 'md', loading, full, ...props }) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${full ? styles.full : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}

export function Input({ label, error, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, ...props }) {
  return (
    <div className={styles.field}>
      {label && <label className={styles.label}>{label}</label>}
      <select className={`${styles.input} ${error ? styles.inputError : ''}`} {...props}>
        {children}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

export function Card({ children, className = '', ...props }) {
  return <div className={`${styles.card} ${className}`} {...props}>{children}</div>;
}

export function Badge({ children, color = 'green' }) {
  return <span className={`${styles.badge} ${styles[`badge_${color}`]}`}>{children}</span>;
}

export function Spinner() {
  return <div className={styles.spinnerLg} />;
}

export function Alert({ type = 'error', children }) {
  return <div className={`${styles.alert} ${styles[`alert_${type}`]}`}>{children}</div>;
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDesc}>{desc}</p>
      {action}
    </div>
  );
}

// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { getDashboard, rodarScheduler } from '../../services/api';
import { Card, Button, Spinner, Alert } from '../../components/ui';
import styles from './Dashboard.module.css';

const CARDS = [
  { key: 'assinaturas_ativas',    label: 'Assinaturas ativas',      icon: '🔄', color: 'green'  },
  { key: 'aguardando_pagamento',  label: 'Aguardando pagamento',     icon: '💳', color: 'yellow' },
  { key: 'em_separacao',          label: 'Em separação',             icon: '📦', color: 'blue'   },
  { key: 'em_rota',               label: 'Em rota de entrega',       icon: '🚗', color: 'orange' },
  { key: 'produtos_estoque_baixo',label: 'Produtos com estoque baixo', icon: '⚠️', color: 'red'  },
];

export default function Dashboard() {
  const [dados, setDados]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    getDashboard().then(r => setDados(r.data)).finally(() => setLoading(false));
  }, []);

  async function dispararScheduler() {
    setMsg('');
    try {
      await rodarScheduler();
      setMsg('Scheduler executado! Recarregue para ver os novos pedidos.');
      getDashboard().then(r => setDados(r.data));
    } catch (err) {
      setMsg(err.response?.data?.erro || 'Erro ao rodar scheduler');
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Visão geral da operação</p>
        </div>
        <Button variant="secondary" onClick={dispararScheduler}>▶ Rodar scheduler</Button>
      </div>

      {msg && <Alert type={msg.includes('Erro') ? 'error' : 'success'}>{msg}</Alert>}

      <div className={styles.grid}>
        {CARDS.map(({ key, label, icon, color }) => (
          <Card key={key} className={`${styles.statCard} ${styles[`card_${color}`]}`}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statNum}>{dados?.[key] ?? '—'}</div>
            <div className={styles.statLabel}>{label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// src/pages/admin/Estoque7Dias.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Badge, Spinner, Alert } from '../../components/ui';
import styles from './Estoque7Dias.module.css';

export default function Estoque7Dias() {
  const [dados, setDados]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState('');

  useEffect(() => {
    api.get('/pedidos/estoque7dias')
      .then(r => setDados(r.data))
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const criticos  = dados.filter(d => d.saldo_apos < 0);
  const atencao   = dados.filter(d => d.saldo_apos >= 0 && d.saldo_apos <= d.estoque_minimo);
  const ok        = dados.filter(d => d.saldo_apos > d.estoque_minimo);

  function renderLinha(d) {
    const saldo = parseInt(d.saldo_apos);
    const badge = saldo < 0
      ? <Badge color="red">Faltam {Math.abs(saldo)} un.</Badge>
      : saldo <= d.estoque_minimo
        ? <Badge color="yellow">Estoque baixo</Badge>
        : <Badge color="green">OK</Badge>;

    return (
      <div key={d.produto_id} className={`${styles.linha} ${saldo < 0 ? styles.linhaCritica : saldo <= d.estoque_minimo ? styles.linhaAtencao : ''}`}>
        <div className={styles.prodInfo}>
          <div className={styles.prodNome}>{d.nome}</div>
          <div className={styles.datas}>
            Entregas em: {(d.datas_geracao || []).map(dt =>
              new Date(dt + 'T12:00:00').toLocaleDateString('pt-BR')
            ).join(', ')}
          </div>
        </div>
        <div className={styles.numeros}>
          <div className={styles.num}>
            <span className={styles.numVal}>{d.estoque_atual}</span>
            <span className={styles.numLabel}>em estoque</span>
          </div>
          <div className={styles.seta}>→</div>
          <div className={styles.num}>
            <span className={styles.numVal}>{d.quantidade_necessaria}</span>
            <span className={styles.numLabel}>necessário</span>
          </div>
          <div className={styles.seta}>=</div>
          <div className={styles.num}>
            <span className={`${styles.numVal} ${saldo < 0 ? styles.vermelho : saldo <= d.estoque_minimo ? styles.amarelo : styles.verde}`}>
              {saldo >= 0 ? saldo : saldo}
            </span>
            <span className={styles.numLabel}>saldo</span>
          </div>
          {badge}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Necessidade de estoque</h1>
          <p className={styles.subtitle}>Próximos 7 dias — {dados.length} produto(s) com demanda</p>
        </div>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      {dados.length === 0 ? (
        <Card><p style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px' }}>Nenhuma demanda nos próximos 7 dias.</p></Card>
      ) : (
        <>
          {criticos.length > 0 && (
            <div className={styles.secao}>
              <div className={styles.secHeader}>
                <span className={styles.secIcon}>🚨</span>
                <h3 className={styles.secTitle}>Estoque insuficiente ({criticos.length})</h3>
              </div>
              <Card className={styles.secCard}>
                {criticos.map(renderLinha)}
              </Card>
            </div>
          )}

          {atencao.length > 0 && (
            <div className={styles.secao}>
              <div className={styles.secHeader}>
                <span className={styles.secIcon}>⚠️</span>
                <h3 className={styles.secTitle}>Atenção — estoque baixo ({atencao.length})</h3>
              </div>
              <Card className={styles.secCard}>
                {atencao.map(renderLinha)}
              </Card>
            </div>
          )}

          {ok.length > 0 && (
            <div className={styles.secao}>
              <div className={styles.secHeader}>
                <span className={styles.secIcon}>✅</span>
                <h3 className={styles.secTitle}>Estoque suficiente ({ok.length})</h3>
              </div>
              <Card className={styles.secCard}>
                {ok.map(renderLinha)}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

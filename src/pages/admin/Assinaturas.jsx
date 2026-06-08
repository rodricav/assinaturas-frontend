// src/pages/admin/Assinaturas.jsx
import { useState, useEffect } from 'react';
import { getAssinaturasAdmin } from '../../services/api';
import { Card, Badge, Spinner, Alert } from '../../components/ui';
import styles from './Assinaturas.module.css';

const STATUS = {
  ativa:     { color: 'green',  label: 'Ativa' },
  pausada:   { color: 'yellow', label: 'Pausada' },
  cancelada: { color: 'red',    label: 'Cancelada' },
};

export default function Assinaturas() {
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState('');
  const [filtro, setFiltro]           = useState('');
  const [aberta, setAberta]           = useState(null);

  async function carregar() {
    setLoading(true);
    try {
      const params = filtro ? { status: filtro } : {};
      const { data } = await getAssinaturasAdmin(params);
      setAssinaturas(data);
    } catch { setErro('Erro ao carregar assinaturas'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [filtro]);

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assinaturas</h1>
          <p className={styles.subtitle}>{assinaturas.length} assinatura(s) encontrada(s)</p>
        </div>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.filtros}>
        {['', 'ativa', 'pausada', 'cancelada'].map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`${styles.filtroBtn} ${filtro === s ? styles.filtroAtivo : ''}`}
          >
            {s === '' ? 'Todas' : STATUS[s]?.label}
          </button>
        ))}
      </div>

      <div className={styles.lista}>
        {assinaturas.map(a => {
          const est       = STATUS[a.status] || STATUS.ativa;
          const expandida = aberta === a.id;

          return (
            <Card key={a.id} className={styles.card}>
              <button className={styles.cardTop} onClick={() => setAberta(expandida ? null : a.id)}>
                <div className={styles.cardId}>
                  <span className={styles.cliente}>{a.cliente_nome}</span>
                  <span className={styles.plano}>{a.plano_nome} · {a.intervalo_dias} dias</span>
                </div>
                <div className={styles.cardTopRight}>
                  <Badge color={est.color}>{est.label}</Badge>
                  <span className={styles.seta}>{expandida ? '▲' : '▼'}</span>
                </div>
              </button>

              {expandida && (
                <div className={styles.detalhes}>
                  <div className={styles.cardInfo}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Cliente</span>
                      <span className={styles.infoVal}>{a.cliente_nome}</span>
                      <span className={styles.infoSub}>{a.cliente_email} · {a.cliente_telefone}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Plano</span>
                      <span className={styles.infoVal}>{a.plano_nome} ({a.intervalo_dias} dias)</span>
                      <span className={styles.infoSub}>Desconto: {parseFloat(a.desconto_pct).toFixed(0)}%</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Início</span>
                      <span className={styles.infoVal}>{new Date(a.data_inicio).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Próxima geração</span>
                      <span className={styles.infoVal}>
                        {a.proxima_geracao ? new Date(a.proxima_geracao).toLocaleDateString('pt-BR') : '—'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Ciclo atual</span>
                      <span className={styles.infoVal}>{a.numero_ciclo_atual}</span>
                    </div>
                  </div>

                  {a.motivo_cancelamento && (
                    <div className={styles.motivo}>✕ Motivo do cancelamento: {a.motivo_cancelamento}</div>
                  )}

                  <div className={styles.itens}>
                    <span className={styles.infoLabel}>Itens da assinatura</span>
                    <ul className={styles.itensLista}>
                      {a.itens.map(item => (
                        <li key={item.produto_id} className={styles.item}>
                          <span>{item.quantidade}× {item.nome}</span>
                          <span className={styles.itemPreco}>R$ {parseFloat(item.preco).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

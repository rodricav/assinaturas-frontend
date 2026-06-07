// src/pages/MeusPedidos.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, Badge, Spinner, Alert, EmptyState } from '../components/ui';
import styles from './MeusPedidos.module.css';

const STATUS_CONFIG = {
  aguardando_pagamento: { color: 'yellow', label: 'Aguardando pagamento', icon: '💳', ordem: 1 },
  confirmado:           { color: 'blue',   label: 'Confirmado',           icon: '✅', ordem: 2 },
  em_separacao:         { color: 'blue',   label: 'Em separação',         icon: '📦', ordem: 3 },
  saiu_para_entrega:    { color: 'orange', label: 'Saiu para entrega',    icon: '🚗', ordem: 4 },
  entregue:             { color: 'green',  label: 'Entregue',             icon: '✅', ordem: 5 },
  cancelado:            { color: 'red',    label: 'Cancelado',            icon: '❌', ordem: 0 },
};

const GRUPOS = [
  { key: 'ativos',    label: 'Em andamento', filtro: p => ['aguardando_pagamento','confirmado','em_separacao','saiu_para_entrega'].includes(p.status) },
  { key: 'entregues', label: 'Entregues',    filtro: p => p.status === 'entregue' },
  { key: 'cancelados',label: 'Cancelados',   filtro: p => p.status === 'cancelado' },
];

export default function MeusPedidos() {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState('');
  const [grupoAtivo, setGrupo]  = useState('ativos');
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    api.get('/pedidos/meus')
      .then(r => setPedidos(r.data))
      .catch(() => setErro('Erro ao carregar pedidos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const grupoAtual = GRUPOS.find(g => g.key === grupoAtivo);
  const pedidosFiltrados = pedidos.filter(grupoAtual.filtro);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Meus pedidos</h1>
        <p className={styles.subtitle}>Acompanhe o status das suas entregas</p>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      {/* Tabs */}
      <div className={styles.tabs}>
        {GRUPOS.map(g => {
          const count = pedidos.filter(g.filtro).length;
          return (
            <button
              key={g.key}
              className={`${styles.tab} ${grupoAtivo === g.key ? styles.tabAtivo : ''}`}
              onClick={() => setGrupo(g.key)}
            >
              {g.label}
              {count > 0 && <span className={styles.tabCount}>{count}</span>}
            </button>
          );
        })}
      </div>

      {pedidosFiltrados.length === 0 ? (
        <EmptyState
          icon={grupoAtivo === 'ativos' ? '📦' : grupoAtivo === 'entregues' ? '✅' : '❌'}
          title={`Nenhum pedido ${grupoAtual.label.toLowerCase()}`}
          desc={grupoAtivo === 'ativos' ? 'Seus pedidos em andamento aparecerão aqui.' : ''}
        />
      ) : (
        <div className={styles.lista}>
          {pedidosFiltrados.map(pedido => {
            const cfg = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.cancelado;
            const aberto = expandido === pedido.id;
            return (
              <Card key={pedido.id} className={styles.card}>
                {/* Cabeçalho */}
                <div className={styles.cardHeader} onClick={() => setExpandido(aberto ? null : pedido.id)}>
                  <div className={styles.cardLeft}>
                    <span className={styles.numPedido}>#{pedido.id.slice(0,8).toUpperCase()}</span>
                    <Badge color={cfg.color}>{cfg.icon} {cfg.label}</Badge>
                  </div>
                  <div className={styles.cardRight}>
                    <span className={styles.total}>R$ {parseFloat(pedido.total).toFixed(2)}</span>
                    <span className={styles.data}>
                      {new Date(pedido.gerado_em).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={styles.chevron}>{aberto ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {aberto && (
                  <div className={styles.cardBody}>

                    {/* Observação do admin */}
                    {pedido.observacao_admin && (
                      <div className={styles.obsAdmin}>
                        <span className={styles.obsLabel}>📋 Observação:</span>
                        <span>{pedido.observacao_admin}</span>
                      </div>
                    )}

                    {/* Itens */}
                    <div className={styles.itens}>
                      {(pedido.itens || []).map(item => (
                        <div key={item.produto_id} className={`${styles.item} ${item.item_em_falta ? styles.itemFalta : ''}`}>
                          <span className={styles.itemEmoji}>{item.foto_url ? <img src={item.foto_url} alt="" /> : '🛒'}</span>
                          <span className={styles.itemNome}>{item.nome}</span>
                          {item.item_em_falta
                            ? <Badge color="red">Indisponível</Badge>
                            : <span className={styles.itemQtd}>x{item.quantidade}</span>
                          }
                          <span className={styles.itemPreco}>
                            {item.item_em_falta ? '—' : `R$ ${(parseFloat(item.preco_unitario) * item.quantidade).toFixed(2)}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Timeline de estágios */}
                    {pedido.historico?.length > 0 && (
                      <div className={styles.timeline}>
                        <h4 className={styles.timelineTitle}>Histórico</h4>
                        <div className={styles.timelineItens}>
                          {pedido.historico.map((h, i) => {
                            const hcfg = STATUS_CONFIG[h.estagio] || {};
                            return (
                              <div key={i} className={styles.timelineItem}>
                                <div className={`${styles.timelineDot} ${styles[`dot_${hcfg.color || 'gray'}`]}`} />
                                <div className={styles.timelineInfo}>
                                  <span className={styles.timelineEstagio}>{hcfg.icon} {hcfg.label || h.estagio}</span>
                                  <span className={styles.timelineData}>
                                    {new Date(h.alterado_em).toLocaleString('pt-BR')}
                                  </span>
                                  {h.observacao && <span className={styles.timelineObs}>{h.observacao}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Botão pagar se aguardando */}
                    {pedido.status === 'aguardando_pagamento' && pedido.mp_preference_id && (
                      <a
                        href={`https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${pedido.mp_preference_id}`}
                        target="_blank" rel="noreferrer"
                        className={styles.pagarBtn}
                      >
                        💳 Pagar agora
                      </a>
                    )}

                    {/* NF-e */}
                    {pedido.nfe_pdf_url && (
                      <a href={pedido.nfe_pdf_url} target="_blank" rel="noreferrer" className={styles.nfeBtn}>
                        📄 Nota fiscal
                      </a>
                    )}

                    {/* Data de entrega */}
                    {pedido.data_entrega_prevista && (
                      <div className={styles.entregaInfo}>
                        📅 Entrega prevista: <strong>
                          {new Date(pedido.data_entrega_prevista).toLocaleDateString('pt-BR')}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

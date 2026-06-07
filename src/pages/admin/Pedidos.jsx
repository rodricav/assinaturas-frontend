// src/pages/admin/Pedidos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPedidos, avancarEstagio } from '../../services/api';
import { Card, Badge, Button, Spinner, Alert, Modal } from '../../components/ui';
import styles from './Pedidos.module.css';

const ESTAGIOS = {
  aguardando_pagamento: { color: 'yellow', label: 'Aguard. pagamento', proximo: 'confirmado' },
  confirmado:           { color: 'blue',   label: 'Confirmado',        proximo: 'em_separacao' },
  em_separacao:         { color: 'blue',   label: 'Em separação',      proximo: 'saiu_para_entrega' },
  saiu_para_entrega:    { color: 'orange', label: 'Saiu p/ entrega',   proximo: 'entregue' },
  entregue:             { color: 'green',  label: 'Entregue',          proximo: null },
  cancelado:            { color: 'red',    label: 'Cancelado',         proximo: null },
};

const PROXIMO_LABEL = {
  confirmado:        'Confirmar',
  em_separacao:      'Iniciar separação',
  saiu_para_entrega: 'Saiu para entrega',
  entregue:          'Marcar entregue',
};

export default function Pedidos() {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState('');
  const [modal, setModal]       = useState(null);
  const [obs, setObs]           = useState('');
  const [acao, setAcao]         = useState(false);
  const [erro, setErro]         = useState('');
  const navigate = useNavigate();

  async function carregar() {
    try {
      const params = filtro ? { status: filtro } : {};
      const { data } = await getPedidos(params);
      setPedidos(data);
    } catch { setErro('Erro ao carregar pedidos'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [filtro]);

  async function confirmarAvanco() {
    setAcao(true); setErro('');
    try {
      await avancarEstagio(modal.pedidoId, { novoEstagio: modal.novoEstagio, observacao: obs });
      setModal(null); setObs('');
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao avançar estágio');
    } finally { setAcao(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pedidos</h1>
          <p className={styles.subtitle}>{pedidos.length} pedido(s) encontrado(s)</p>
        </div>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.filtros}>
        {['', 'aguardando_pagamento', 'confirmado', 'em_separacao', 'saiu_para_entrega', 'entregue', 'cancelado'].map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`${styles.filtroBtn} ${filtro === s ? styles.filtroAtivo : ''}`}
          >
            {s === '' ? 'Todos' : ESTAGIOS[s]?.label}
          </button>
        ))}
      </div>

      <div className={styles.lista}>
        {pedidos.map(p => {
          const est    = ESTAGIOS[p.status] || ESTAGIOS.cancelado;
          const proximo = est.proximo;
          const podeEditar = ['aguardando_pagamento', 'confirmado'].includes(p.status);

          return (
            <Card key={p.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardId}>
                  <span className={styles.numPedido}>#{p.id.slice(0,8).toUpperCase()}</span>
                  <span className={styles.ciclo}>Ciclo {p.numero_ciclo}</span>
                </div>
                <Badge color={est.color}>{est.label}</Badge>
              </div>

              <div className={styles.cardInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Cliente</span>
                  <span className={styles.infoVal}>{p.cliente_nome}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Total</span>
                  <span className={styles.infoVal}>R$ {parseFloat(p.total).toFixed(2)}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Entrega prevista</span>
                  <span className={styles.infoVal}>
                    {p.data_entrega_prevista
                      ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR')
                      : '—'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Gerado em</span>
                  <span className={styles.infoVal}>{new Date(p.gerado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Observação do admin */}
              {p.observacao_admin && (
                <div className={styles.obsAdmin}>📋 {p.observacao_admin}</div>
              )}

              <div className={styles.cardActions}>
                {podeEditar && (
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/painel/pedidos/${p.id}/editar`)}>
                    ✏️ Editar
                  </Button>
                )}
                {proximo && (
                  <Button size="sm" onClick={() => setModal({ pedidoId: p.id, novoEstagio: proximo })}>
                    {PROXIMO_LABEL[proximo]} →
                  </Button>
                )}
                {proximo && proximo !== 'entregue' && (
                  <Button size="sm" variant="danger" onClick={() => setModal({ pedidoId: p.id, novoEstagio: 'cancelado' })}>
                    Cancelar
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title="Confirmar avanço de estágio">
        <div className={styles.modalContent}>
          <p>Avançar para: <strong>{modal?.novoEstagio && ESTAGIOS[modal.novoEstagio]?.label}</strong></p>
          <textarea
            className={styles.obsInput} rows={3}
            placeholder="Observação (opcional)"
            value={obs} onChange={e => setObs(e.target.value)}
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={acao} onClick={confirmarAvanco}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

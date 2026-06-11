// src/components/ProximaEntrega.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Badge, Modal, Button } from './ui';
import styles from './ProximaEntrega.module.css';

const STATUS_LABEL = {
  aguardando_pagamento: { label: 'Aguardando pagamento', color: 'yellow', icon: '💳' },
  confirmado:           { label: 'Confirmado',           color: 'blue',   icon: '✅' },
  em_separacao:         { label: 'Em separação',         color: 'blue',   icon: '📦' },
  saiu_para_entrega:    { label: 'Saiu para entrega',    color: 'orange', icon: '🚗' },
};

function parseDateLocal(str) {
  if (!str) return null;
  const [ano, mes, dia] = str.split('T')[0].split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  return isNaN(d.getTime()) ? null : d;
}

function addDias(date, dias) {
  const d = new Date(date);
  d.setDate(d.getDate() + dias);
  return d;
}

function formatarData(date) {
  if (!date) return null;
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ProximaEntrega() {
  const [dados, setDados]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [modalEscolha, setModalEscolha] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/assinaturas/minhas'),
      api.get('/pedidos/meus'),
    ]).then(([rAssin, rPedidos]) => {
      const assinaturas = rAssin.data.filter(a => a.status === 'ativa');
      if (!assinaturas.length) { setLoading(false); return; }

      const proxima = assinaturas.sort((a, b) =>
        new Date(a.proxima_geracao) - new Date(b.proxima_geracao)
      )[0];

      const pedidoAtivo = rPedidos.data.find(p =>
        ['aguardando_pagamento','confirmado','em_separacao','saiu_para_entrega'].includes(p.status)
      );

      setDados({ assinatura: proxima, pedido: pedidoAtivo || null });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || !dados) return null;

  const { assinatura, pedido } = dados;
  const dataPedido  = parseDateLocal(assinatura.proxima_geracao);
  const prazo       = parseInt(assinatura.prazo_dias || 1);
  const dataEntrega = dataPedido ? addDias(dataPedido, prazo) : null;
  const hoje        = new Date(); hoje.setHours(0,0,0,0);
  const diffDias    = dataPedido ? Math.ceil((dataPedido - hoje) / (1000 * 60 * 60 * 24)) : null;

  function handleAlterar() {
    if (pedido?.status === 'aguardando_pagamento') {
      setModalEscolha(true);
    } else {
      navigate(`/assinaturas/${assinatura.id}/editar`);
    }
  }

  return (
    <>
      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.topRow}>
            <div className={styles.titleRow}>
              <span className={styles.icon}>📦</span>
              <div>
                <h3 className={styles.titulo}>Próxima entrega</h3>
                <p className={styles.plano}>{assinatura.plano_nome} · a cada {assinatura.intervalo_dias} dias</p>
              </div>
            </div>
            {diffDias !== null && diffDias <= 3 && diffDias > 0 && (
              <span className={styles.urgente}>Em {diffDias} dia{diffDias > 1 ? 's' : ''}!</span>
            )}
          </div>

          <div className={styles.datas}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Próximo pedido</span>
              <span className={styles.dataValor}>{dataPedido ? formatarData(dataPedido) : '—'}</span>
            </div>
            <div className={styles.dataDiv} />
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>Estimativa de entrega</span>
              <span className={`${styles.dataValor} ${styles.dataEntrega}`}>
                {dataEntrega ? formatarData(dataEntrega) : '—'}
              </span>
            </div>
          </div>

          {pedido && (
            <div className={styles.pedidoBox}>
              <div className={styles.pedidoRow}>
                <span className={styles.pedidoNum}>
                  {pedido.numero_pedido || '#' + pedido.id.slice(0,8).toUpperCase()}
                </span>
                <Badge color={STATUS_LABEL[pedido.status]?.color || 'gray'}>
                  {STATUS_LABEL[pedido.status]?.icon} {STATUS_LABEL[pedido.status]?.label}
                </Badge>
              </div>
              {pedido.status === 'aguardando_pagamento' && pedido.mp_preference_id && (
                <a
                  href={`https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${pedido.mp_preference_id}`}
                  target="_blank" rel="noreferrer"
                  className={styles.btnPagar}
                >
                  💳 Pagar agora — R$ {parseFloat(pedido.total).toFixed(2)}
                </a>
              )}
            </div>
          )}

          {!pedido && assinatura.itens?.length > 0 && (
            <div className={styles.itens}>
              {assinatura.itens.slice(0, 3).map(item => (
                <div key={item.produto_id} className={styles.item}>
                  <span>{item.nome}</span>
                  <span className={styles.itemQtd}>×{item.quantidade}</span>
                </div>
              ))}
              {assinatura.itens.length > 3 && (
                <p className={styles.maisItens}>+{assinatura.itens.length - 3} itens</p>
              )}
            </div>
          )}

          <div className={styles.rodape}>
            {diffDias !== null && diffDias >= 3 && (
              <button className={styles.btnLink} onClick={handleAlterar}>
                ✏️ Alterar itens
              </button>
            )}
            <button className={styles.btnLink} onClick={() => navigate('/pedidos')}>
              Ver todos os pedidos →
            </button>
          </div>
        </div>
      </div>

      {/* Modal de escolha quando há pedido aguardando pagamento */}
      <Modal open={modalEscolha} onClose={() => setModalEscolha(false)}
        title="O que deseja alterar?">
        <div className={styles.modalEscolha}>
          <p className={styles.modalDesc}>
            Você tem um pedido <strong>{pedido?.numero_pedido}</strong> aguardando pagamento.
            O que deseja fazer?
          </p>

          <div className={styles.opcoes}>
            <button className={styles.opcao}
              onClick={() => { setModalEscolha(false); navigate(`/pedidos/${pedido.id}/editar-cliente`); }}>
              <span className={styles.opcaoIcon}>📦</span>
              <div>
                <strong>Alterar somente este pedido</strong>
                <p>Muda os itens do pedido atual. Um novo link de pagamento será gerado.</p>
              </div>
            </button>

            <button className={styles.opcao}
              onClick={() => { setModalEscolha(false); navigate(`/pedidos/${pedido.id}/editar-cliente?tambem_assinatura=1&assinatura_id=${assinatura.id}`); }}>
              <span className={styles.opcaoIcon}>🔄</span>
              <div>
                <strong>Alterar este pedido e a assinatura</strong>
                <p>Muda o pedido atual e salva os mesmos itens para as próximas entregas.</p>
              </div>
            </button>

            <button className={styles.opcao}
              onClick={() => { setModalEscolha(false); navigate(`/assinaturas/${assinatura.id}/editar`); }}>
              <span className={styles.opcaoIcon}>📅</span>
              <div>
                <strong>Alterar somente a assinatura</strong>
                <p>Mantém o pedido atual como está. Altera apenas as próximas entregas.</p>
              </div>
            </button>
          </div>

          <Button variant="ghost" onClick={() => setModalEscolha(false)}>Cancelar</Button>
        </div>
      </Modal>
    </>
  );
}

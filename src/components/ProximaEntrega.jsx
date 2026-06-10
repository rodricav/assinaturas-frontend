// src/components/ProximaEntrega.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Card, Button, Badge } from './ui';
import styles from './ProximaEntrega.module.css';

export default function ProximaEntrega() {
  const [dados, setDados]   = useState(null);
  const [loading, setLoading] = useState(true);
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

      // Pedido em andamento mais recente
      const pedidoAtivo = rPedidos.data.find(p =>
        ['aguardando_pagamento','confirmado','em_separacao','saiu_para_entrega'].includes(p.status)
      );

      setDados({ assinatura: proxima, pedido: pedidoAtivo || null });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading || !dados) return null;

  const { assinatura, pedido } = dados;
  const dataEntrega = new Date(assinatura.proxima_geracao + 'T12:00:00');
  const hoje        = new Date();
  const diffDias    = Math.ceil((dataEntrega - hoje) / (1000 * 60 * 60 * 24));

  const STATUS_LABEL = {
    aguardando_pagamento: { label: 'Aguardando pagamento', color: 'yellow', icon: '💳' },
    confirmado:           { label: 'Confirmado',           color: 'blue',   icon: '✅' },
    em_separacao:         { label: 'Em separação',         color: 'blue',   icon: '📦' },
    saiu_para_entrega:    { label: 'Saiu para entrega',    color: 'orange', icon: '🚗' },
  };

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <div className={styles.icon}>📅</div>
        <div>
          <h3 className={styles.titulo}>Próxima entrega</h3>
          <p className={styles.plano}>{assinatura.plano_nome} · a cada {assinatura.intervalo_dias} dias</p>
        </div>
        {diffDias <= 3 && diffDias > 0 && (
          <span className={styles.urgente}>⚡ Em {diffDias} dia{diffDias > 1 ? 's' : ''}</span>
        )}
      </div>

      <div className={styles.data}>
        {dataEntrega.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      {/* Pedido em andamento */}
      {pedido && (
        <div className={styles.pedidoAtivo}>
          <div className={styles.pedidoHeader}>
            <span className={styles.pedidoNum}>{pedido.numero_pedido || '#' + pedido.id.slice(0,8).toUpperCase()}</span>
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

      {/* Itens da assinatura */}
      {!pedido && assinatura.itens?.length > 0 && (
        <div className={styles.itens}>
          {assinatura.itens.slice(0, 3).map(item => (
            <div key={item.produto_id} className={styles.item}>
              <span className={styles.itemNome}>{item.nome}</span>
              <span className={styles.itemQtd}>×{item.quantidade}</span>
            </div>
          ))}
          {assinatura.itens.length > 3 && (
            <p className={styles.maisItens}>+{assinatura.itens.length - 3} itens</p>
          )}
        </div>
      )}

      <div className={styles.acoes}>
        {diffDias > 3 && (
          <Button size="sm" variant="ghost"
            onClick={() => navigate(`/assinaturas/${assinatura.id}/editar`)}>
            ✏️ Alterar itens
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => navigate('/pedidos')}>
          Ver pedidos
        </Button>
      </div>
    </Card>
  );
}
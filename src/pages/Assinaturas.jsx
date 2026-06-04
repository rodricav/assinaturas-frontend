// src/pages/Assinaturas.jsx
import { useState, useEffect } from 'react';
import { getMinhasAssinaturas, pausarAssinatura, reativarAssinatura, cancelarAssinatura } from '../services/api';
import { Button, Card, Badge, Spinner, EmptyState, Modal, Alert } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import styles from './Assinaturas.module.css';

const STATUS_BADGE = {
  ativa:     { color: 'green',  label: 'Ativa' },
  pausada:   { color: 'yellow', label: 'Pausada' },
  cancelada: { color: 'gray',   label: 'Cancelada' },
};

const ESTAGIO_BADGE = {
  aguardando_pagamento: { color: 'yellow', label: 'Aguardando pagamento' },
  confirmado:           { color: 'blue',   label: 'Confirmado' },
  em_separacao:         { color: 'blue',   label: 'Em separação' },
  saiu_para_entrega:    { color: 'orange', label: 'Saiu para entrega' },
  entregue:             { color: 'green',  label: 'Entregue' },
  cancelado:            { color: 'red',    label: 'Cancelado' },
};

export default function Assinaturas() {
  const [assinaturas, setAssinaturas] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState('');
  const [modal, setModal]             = useState(null); // { tipo, id }
  const [motivo, setMotivo]           = useState('');
  const [acao, setAcao]               = useState(false);
  const navigate = useNavigate();

  async function carregar() {
    try {
      const { data } = await getMinhasAssinaturas();
      setAssinaturas(data);
    } catch { setErro('Erro ao carregar assinaturas'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  async function executarAcao() {
    setAcao(true);
    try {
      if (modal.tipo === 'pausar')   await pausarAssinatura(modal.id);
      if (modal.tipo === 'reativar') await reativarAssinatura(modal.id);
      if (modal.tipo === 'cancelar') await cancelarAssinatura(modal.id, { motivo });
      setModal(null); setMotivo('');
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao executar ação');
    } finally { setAcao(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Minhas assinaturas</h1>
          <p className={styles.subtitle}>Gerencie suas entregas recorrentes</p>
        </div>
        <Button onClick={() => navigate('/')}>+ Nova assinatura</Button>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      {assinaturas.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Nenhuma assinatura ainda"
          desc="Escolha seus produtos favoritos e configure sua primeira entrega recorrente."
          action={<Button onClick={() => navigate('/')}>Ver catálogo</Button>}
        />
      ) : (
        <div className={styles.lista}>
          {assinaturas.map(a => {
            const sb = STATUS_BADGE[a.status] || STATUS_BADGE.ativa;
            return (
              <Card key={a.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardTopo}>
                      <h3 className={styles.planoNome}>{a.plano_nome}</h3>
                      <Badge color={sb.color}>{sb.label}</Badge>
                    </div>
                    <p className={styles.cardSub}>A cada {a.intervalo_dias} dias</p>
                  </div>
                  <div className={styles.actions}>
                    {a.status === 'ativa'   && <Button size="sm" variant="ghost" onClick={() => setModal({ tipo: 'pausar',   id: a.id })}>Pausar</Button>}
                    {a.status === 'pausada' && <Button size="sm" variant="secondary" onClick={() => setModal({ tipo: 'reativar', id: a.id })}>Reativar</Button>}
                    {a.status !== 'cancelada' && <Button size="sm" variant="danger" onClick={() => setModal({ tipo: 'cancelar', id: a.id })}>Cancelar</Button>}
                  </div>
                </div>

                <div className={styles.itens}>
                  {(a.itens || []).map(item => (
                    <div key={item.produto_id} className={styles.item}>
                      <span className={styles.itemEmoji}>🛒</span>
                      <span className={styles.itemNome}>{item.nome}</span>
                      <span className={styles.itemQtd}>x{item.quantidade}</span>
                      <span className={styles.itemPreco}>R$ {parseFloat(item.preco).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerInfo}>
                    <span className={styles.footerLabel}>Próxima entrega</span>
                    <span className={styles.footerVal}>
                      {a.proxima_geracao
                        ? new Date(a.proxima_geracao).toLocaleDateString('pt-BR')
                        : '—'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.tipo === 'pausar' ? 'Pausar assinatura' : modal?.tipo === 'reativar' ? 'Reativar assinatura' : 'Cancelar assinatura'}
      >
        <div className={styles.modalContent}>
          {modal?.tipo === 'pausar'   && <p>Sua assinatura será pausada e nenhum pedido será gerado até você reativar.</p>}
          {modal?.tipo === 'reativar' && <p>Sua assinatura voltará a gerar pedidos normalmente.</p>}
          {modal?.tipo === 'cancelar' && (
            <>
              <p>Tem certeza que deseja cancelar? Esta ação não pode ser desfeita.</p>
              <textarea
                className={styles.motivoInput}
                placeholder="Motivo do cancelamento (opcional)"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={3}
              />
            </>
          )}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setModal(null)}>Voltar</Button>
            <Button
              variant={modal?.tipo === 'cancelar' ? 'danger' : 'primary'}
              loading={acao}
              onClick={executarAcao}
            >
              {modal?.tipo === 'pausar' ? 'Pausar' : modal?.tipo === 'reativar' ? 'Reativar' : 'Cancelar assinatura'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

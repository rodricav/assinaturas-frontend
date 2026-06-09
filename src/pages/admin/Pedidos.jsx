// src/pages/admin/Pedidos.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPedidos, avancarEstagio } from '../../services/api';
import api from '../../services/api';
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

function imprimirPedido(p) {
  const itens = (p.itens || []).map(i =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${i.nome || i.produto_nome || '—'}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantidade}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R$ ${(parseFloat(i.preco_unitario||0)*i.quantidade).toFixed(2)}</td>
    </tr>`
  ).join('');

  const html = `
    <html><head>
      <title>Separação ${p.numero_pedido || p.id?.slice(0,8)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #333; }
        h1 { color: #1a6b3c; margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
        .info { display: flex; gap: 40px; margin-bottom: 24px; flex-wrap: wrap; }
        .info-item { display: flex; flex-direction: column; gap: 2px; }
        .info-label { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 0.05em; }
        .info-val { font-size: 15px; font-weight: 600; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f5f5f5; }
        th { padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666; }
        th:last-child { text-align: right; }
        th:nth-child(2) { text-align: center; }
        .total { text-align: right; margin-top: 16px; font-size: 16px; font-weight: 700; }
        .obs { margin-top: 20px; background: #fff8e6; padding: 12px; border-radius: 6px; font-size: 13px; }
        @media print { body { padding: 16px; } }
      </style>
    </head><body>
      <h1>Lista de separação</h1>
      <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
      <div class="info">
        <div class="info-item">
          <span class="info-label">Pedido</span>
          <span class="info-val">${p.numero_pedido || '#' + (p.id?.slice(0,8)||'').toUpperCase()}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Cliente</span>
          <span class="info-val">${p.cliente_nome}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Entrega prevista</span>
          <span class="info-val">${p.data_entrega_prevista ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR') : '—'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-val">${ESTAGIOS[p.status]?.label || p.status}</span>
        </div>
      </div>
      <table>
        <thead><tr>
          <th>Produto</th><th>Qtd</th><th>Subtotal</th>
        </tr></thead>
        <tbody>${itens}</tbody>
      </table>
      <div class="total">Total: R$ ${parseFloat(p.total||0).toFixed(2)}</div>
      ${p.observacao_admin ? `<div class="obs">📋 <strong>Observação:</strong> ${p.observacao_admin}</div>` : ''}
    </body></html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function Pedidos() {
  const [pedidos, setPedidos]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim]       = useState('');
  const [modal, setModal]           = useState(null);
  const [obs, setObs]               = useState('');
  const [acao, setAcao]             = useState(false);
  const [erro, setErro]             = useState('');
  const navigate = useNavigate();

  async function carregar() {
    try {
      const params = {};
      if (filtro)     params.status      = filtro;
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim)    params.data_fim    = dataFim;
      const { data } = await getPedidos(params);
      setPedidos(data);
    } catch { setErro('Erro ao carregar pedidos'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [filtro, dataInicio, dataFim]);

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

  async function handleImprimir(p) {
    try {
      const { data } = await api.get(`/pedidos/${p.id}`);
      imprimirPedido(data);
    } catch {
      imprimirPedido(p);
    }
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

      <div className={styles.filtroData}>
        <label className={styles.filtroDataLabel}>
          Entrega de
          <input type="date" className={styles.filtroDataInput}
            value={dataInicio} onChange={e => setDataInicio(e.target.value)}
            max={dataFim || undefined} />
        </label>
        <label className={styles.filtroDataLabel}>
          até
          <input type="date" className={styles.filtroDataInput}
            value={dataFim} onChange={e => setDataFim(e.target.value)}
            min={dataInicio || undefined} />
        </label>
        {(dataInicio || dataFim) && (
          <button className={styles.limparData} onClick={() => { setDataInicio(''); setDataFim(''); }}>
            Limpar datas ✕
          </button>
        )}
      </div>

      <div className={styles.lista}>
        {pedidos.map(p => {
          const est     = ESTAGIOS[p.status] || ESTAGIOS.cancelado;
          const proximo = est.proximo;
          const podeEditar = ['aguardando_pagamento', 'confirmado'].includes(p.status);

          return (
            <Card key={p.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardId}>
                  <span className={styles.numPedido}>{p.numero_pedido || '#' + p.id.slice(0,8).toUpperCase()}</span>
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
                    {p.data_entrega_prevista ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Gerado em</span>
                  <span className={styles.infoVal}>{new Date(p.gerado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {p.observacao_admin && (
                <div className={styles.obsAdmin}>📋 {p.observacao_admin}</div>
              )}

              <div className={styles.cardActions}>
                <Button size="sm" variant="ghost" onClick={() => handleImprimir(p)}>
                  🖨️ Imprimir
                </Button>
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
          <textarea className={styles.obsInput} rows={3}
            placeholder="Observação (opcional)"
            value={obs} onChange={e => setObs(e.target.value)} />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button loading={acao} onClick={confirmarAvanco}>Confirmar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

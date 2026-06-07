// src/pages/admin/Proximos7Dias.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Badge, Spinner, Alert, Button } from '../../components/ui';
import styles from './Proximos7Dias.module.css';

function gerarPDF(pedidos) {
  const linhas = pedidos.map(p => {
    const dataFormatada = p.data_prevista
      ? new Date(p.data_prevista).toLocaleDateString('pt-BR')
      : p.proxima_geracao
        ? new Date(p.proxima_geracao).toLocaleDateString('pt-BR')
        : '—';

    const tipoLabel = p.tipo === 'estimativa'
      ? '<span style="background:#fff8e6;color:#b45309;padding:2px 8px;border-radius:4px;font-size:11px">ESTIMATIVA</span>'
      : '<span style="background:#e8f5ee;color:#1a6b3c;padding:2px 8px;border-radius:4px;font-size:11px">PEDIDO REAL</span>';

    const itens = (p.itens || []).map(i =>
      `<tr>
        <td style="padding:6px">${i.nome}</td>
        <td style="text-align:center;padding:6px">${i.quantidade}</td>
        <td style="text-align:center;padding:6px;color:${i.estoque_atual < i.quantidade ? '#c0392b' : '#1a6b3c'}">${i.estoque_atual}</td>
      </tr>`
    ).join('');

    return `
      <div style="page-break-inside:avoid;margin-bottom:20px;border:1px solid #e0e0e0;border-radius:8px;padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <strong style="font-size:15px">${p.cliente_nome}</strong>
              ${tipoLabel}
            </div>
            <div style="color:#666;font-size:12px">${p.cliente_email}</div>
            <div style="color:#666;font-size:12px;margin-top:2px">${p.endereco || ''}, ${p.numero || ''}${p.complemento ? ' ' + p.complemento : ''} — ${p.bairro || ''}, ${p.cidade || ''}/${p.estado || ''}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="color:#1a6b3c;font-weight:600">📅 ${dataFormatada}</div>
            ${p.total ? `<div style="color:#666;font-size:12px">Total: R$ ${parseFloat(p.total).toFixed(2)}</div>` : ''}
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f5f5f5">
            <th style="text-align:left;padding:6px">Produto</th>
            <th style="padding:6px">Qtd</th>
            <th style="padding:6px">Estoque</th>
          </tr></thead>
          <tbody>${itens}</tbody>
        </table>
      </div>
    `;
  }).join('');

  const html = `
    <html><head>
      <title>Lista de separação — Próximos 7 dias</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#333} h1{color:#1a6b3c} @media print{body{padding:0}}</style>
    </head><body>
      <h1>Lista de separação</h1>
      <p style="color:#666;margin-bottom:24px">Gerado em ${new Date().toLocaleString('pt-BR')} — ${pedidos.length} entrega(s)</p>
      ${linhas}
    </body></html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

const STATUS_BADGE = {
  aguardando_pagamento: { color: 'yellow', label: 'Aguard. pagamento' },
  confirmado:           { color: 'blue',   label: 'Confirmado' },
  em_separacao:         { color: 'blue',   label: 'Em separação' },
  previsto:             { color: 'gray',   label: 'Estimativa' },
};

export default function Proximos7Dias() {
  const [dados, setDados]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState('');

  useEffect(() => {
    api.get('/pedidos/proximos7dias')
      .then(r => setDados(r.data))
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  // Agrupa por data
  const porData = dados.reduce((acc, p) => {
    const dt = p.data_prevista
      ? new Date(p.data_prevista).toISOString().split('T')[0]
      : p.proxima_geracao;
    if (!acc[dt]) acc[dt] = [];
    acc[dt].push(p);
    return acc;
  }, {});

  const totalReais      = dados.filter(d => d.tipo === 'pedido').length;
  const totalEstimativas = dados.filter(d => d.tipo === 'estimativa').length;

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Próximos 7 dias</h1>
          <p className={styles.subtitle}>
            {totalReais} pedido(s) real(is) · {totalEstimativas} estimativa(s)
          </p>
        </div>
        {dados.length > 0 && (
          <Button variant="secondary" onClick={() => gerarPDF(dados)}>
            🖨️ Imprimir lista completa
          </Button>
        )}
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      {/* Legenda */}
      {dados.length > 0 && (
        <div className={styles.legenda}>
          <div className={styles.legendaItem}>
            <span className={styles.legendaDot} style={{ background: '#3b82f6' }} />
            <span>Pedido gerado (real)</span>
          </div>
          <div className={styles.legendaItem}>
            <span className={styles.legendaDot} style={{ background: '#94a3b8' }} />
            <span>Estimativa (assinatura prevista, pedido ainda não gerado)</span>
          </div>
        </div>
      )}

      {dados.length === 0 ? (
        <Card className={styles.vazio}><p>Nenhuma entrega prevista nos próximos 7 dias.</p></Card>
      ) : (
        Object.entries(porData).sort().map(([data, itensData]) => (
          <div key={data} className={styles.grupo}>
            <div className={styles.dataHeader}>
              <span className={styles.dataLabel}>
                📅 {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <Badge color="blue">{itensData.length} entrega(s)</Badge>
            </div>

            <div className={styles.cards}>
              {itensData.map((p, i) => (
                <Card key={i} className={`${styles.card} ${p.tipo === 'estimativa' ? styles.cardEstimativa : ''}`}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardInfo}>
                      <div className={styles.clienteRow}>
                        <span className={styles.clienteNome}>{p.cliente_nome}</span>
                        {p.tipo === 'estimativa'
                          ? <Badge color="gray">Estimativa</Badge>
                          : <Badge color={STATUS_BADGE[p.status]?.color || 'blue'}>{STATUS_BADGE[p.status]?.label || p.status}</Badge>
                        }
                      </div>
                      <div className={styles.clienteEmail}>{p.cliente_email}</div>
                      <div className={styles.clienteEnd}>
                        {p.endereco}, {p.numero}{p.complemento ? ` ${p.complemento}` : ''} — {p.bairro}, {p.cidade}/{p.estado}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => gerarPDF([p])}>
                      🖨️
                    </Button>
                  </div>

                  <div className={styles.itens}>
                    {(p.itens || []).map((item, j) => (
                      <div key={j} className={styles.item}>
                        <span className={styles.itemNome}>{item.nome}</span>
                        <span className={styles.itemQtd}>x{item.quantidade}</span>
                        {item.estoque_atual < item.quantidade && (
                          <Badge color="red">⚠️ Estoque insuf.</Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Range de entrega */}
                  <div className={styles.rangeEntrega}>
                    {p.numero_pedido && (
                      <span className={styles.numPedido}>{p.numero_pedido}</span>
                    )}
                    {p.data_entrega_minima && p.data_entrega_maxima ? (
                      <span>📅 Entrega entre <strong>{new Date(p.data_entrega_minima + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> e <strong>{new Date(p.data_entrega_maxima + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></span>
                    ) : p.data_prevista ? (
                      <span>📅 Entrega prevista: <strong>{new Date(p.data_prevista).toLocaleDateString('pt-BR')}</strong></span>
                    ) : null}
                  </div>
                  {p.tipo === 'estimativa' && (
                    <div className={styles.estimativaAviso}>
                      ℹ️ Pedido será gerado em {new Date(p.proxima_geracao + 'T12:00:00').toLocaleDateString('pt-BR')} pelo scheduler
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

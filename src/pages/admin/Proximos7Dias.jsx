// src/pages/admin/Proximos7Dias.jsx
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Badge, Spinner, Alert, Button } from '../../components/ui';
import styles from './Proximos7Dias.module.css';

function gerarPDF(pedidos) {
  // Monta HTML para impressão
  const linhas = pedidos.map(p => {
    const dataFormatada = new Date(p.proxima_geracao).toLocaleDateString('pt-BR');
    const itens = (p.itens || []).map(i =>
      `<tr>
        <td>${i.nome}</td>
        <td style="text-align:center">${i.quantidade}</td>
        <td style="text-align:center;color:${i.estoque_atual < i.quantidade ? '#c0392b' : '#1a6b3c'}">${i.estoque_atual}</td>
        <td>R$ ${(parseFloat(i.preco) * i.quantidade).toFixed(2)}</td>
      </tr>`
    ).join('');

    return `
      <div style="page-break-inside:avoid;margin-bottom:24px;border:1px solid #e0e0e0;border-radius:8px;padding:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <div>
            <strong style="font-size:16px">${p.cliente_nome}</strong><br>
            <span style="color:#666;font-size:13px">${p.cliente_email}</span><br>
            <span style="color:#666;font-size:13px">${p.endereco}, ${p.numero}${p.complemento ? ' ' + p.complemento : ''} — ${p.bairro}, ${p.cidade}/${p.estado} — CEP ${p.cep}</span>
          </div>
          <div style="text-align:right">
            <strong style="color:#1a6b3c">Entrega: ${dataFormatada}</strong><br>
            <span style="color:#666;font-size:13px">Prazo: ${p.prazo_dias} dia(s) útil(eis)</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="text-align:left;padding:6px">Produto</th>
              <th style="padding:6px">Qtd</th>
              <th style="padding:6px">Estoque</th>
              <th style="text-align:left;padding:6px">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itens}</tbody>
        </table>
      </div>
    `;
  }).join('');

  const html = `
    <html>
    <head>
      <title>Separação — Próximos 7 dias</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
        h1 { color: #1a6b3c; margin-bottom: 8px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>Lista de separação</h1>
      <p style="color:#666;margin-bottom:24px">Gerado em ${new Date().toLocaleString('pt-BR')} — ${pedidos.length} entrega(s)</p>
      ${linhas}
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function Proximos7Dias() {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    api.get('/pedidos/proximos7dias')
      .then(r => setPedidos(r.data))
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  // Agrupa por data
  const porData = pedidos.reduce((acc, p) => {
    const data = p.proxima_geracao;
    if (!acc[data]) acc[data] = [];
    acc[data].push(p);
    return acc;
  }, {});

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Próximos 7 dias</h1>
          <p className={styles.subtitle}>{pedidos.length} entrega(s) prevista(s)</p>
        </div>
        {pedidos.length > 0 && (
          <Button variant="secondary" onClick={() => gerarPDF(pedidos)}>
            🖨️ Imprimir lista de separação
          </Button>
        )}
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      {pedidos.length === 0 ? (
        <Card className={styles.vazio}>
          <p>Nenhuma entrega prevista nos próximos 7 dias.</p>
        </Card>
      ) : (
        Object.entries(porData).map(([data, itensData]) => (
          <div key={data} className={styles.grupo}>
            <div className={styles.dataHeader}>
              <span className={styles.dataLabel}>
                📅 {new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <Badge color="blue">{itensData.length} entrega(s)</Badge>
            </div>

            <div className={styles.cards}>
              {itensData.map((p, i) => (
                <Card key={i} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.clienteNome}>{p.cliente_nome}</div>
                      <div className={styles.clienteEmail}>{p.cliente_email}</div>
                      <div className={styles.clienteEnd}>
                        {p.endereco}, {p.numero}{p.complemento ? ` ${p.complemento}` : ''} — {p.bairro}, {p.cidade}/{p.estado}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => gerarPDF([p])}>
                      🖨️ Imprimir
                    </Button>
                  </div>

                  <div className={styles.itens}>
                    {(p.itens || []).map((item, j) => (
                      <div key={j} className={styles.item}>
                        <span className={styles.itemNome}>{item.nome}</span>
                        <span className={styles.itemQtd}>x{item.quantidade}</span>
                        {item.estoque_atual < item.quantidade && (
                          <Badge color="red">Estoque insuficiente</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

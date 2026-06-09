// src/pages/admin/EditarPedido.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getEnderecos, getProdutosAdmin } from '../../services/api';
import { Card, Button, Input, Alert, Spinner, Badge, Modal } from '../../components/ui';
import GerenciarEnderecos from '../../components/GerenciarEnderecos';
import styles from './EditarPedido.module.css';

export default function EditarPedido() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [pedido, setPedido]         = useState(null);
  const [produtos, setProdutos]     = useState([]);
  const [carrinho, setCarrinho]     = useState({});
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState('');

  // Endereço
  const [enderecos, setEnderecos]   = useState([]);
  const [enderecoId, setEnderecoId] = useState(null);
  const [modalEnd, setModalEnd]     = useState(false);

  const clienteId = pedido?.assinatura_id; // usado para buscar endereços

  useEffect(() => {
    Promise.all([
      api.get(`/pedidos/${id}`),
      getProdutosAdmin(),
    ]).then(([rPedido, rProd]) => {
      const p = rPedido.data;
      setPedido(p);
      setProdutos(rProd.data);
      setObservacao(p.observacao_admin || '');

      const c = {};
      (p.itens || []).forEach(item => {
        if (!item.item_em_falta) c[item.produto_id] = item.quantidade;
      });
      setCarrinho(c);

      // Busca endereços passando cliente_id via query
      api.get('/enderecos', { params: { cliente_id: p.cliente_id } })
        .then(r => {
          setEnderecos(r.data);
          // Pré-seleciona o endereço atual da assinatura ou o principal
          const principal = r.data.find(e => e.principal);
          if (principal) setEnderecoId(principal.id);
        })
        .catch(() => {});
    }).catch(() => setErro('Erro ao carregar pedido'))
    .finally(() => setLoading(false));
  }, [id]);

  const add    = (pid) => setCarrinho(c => ({ ...c, [pid]: (c[pid] || 0) + 1 }));
  const remove = (pid) => setCarrinho(c => {
    const n = { ...c };
    if (n[pid] > 1) n[pid]--; else delete n[pid];
    return n;
  });

  const endSel    = enderecos.find(e => e.id === enderecoId);
  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const subtotal   = Object.entries(carrinho).reduce((acc, [pid, qtd]) => {
    const p = produtos.find(x => x.id === pid);
    return acc + (p ? parseFloat(p.preco) * qtd : 0);
  }, 0);
  const frete      = endSel ? parseFloat(endSel.custo_entrega || 0) : 0;
  const totalValor = subtotal + frete;

  function feedback(msg, tipo = 'sucesso') {
    if (tipo === 'sucesso') { setSucesso(msg); setErro(''); }
    else { setErro(msg); setSucesso(''); }
    setTimeout(() => { setSucesso(''); setErro(''); }, 4000);
  }

  async function salvar() {
    if (totalItens === 0) { setErro('Selecione ao menos um produto'); return; }
    setSalvando(true); setErro('');
    try {
      const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
      await api.patch(`/pedidos/${id}/itens`, { itens, observacao });
      // Salva endereço se mudou
      if (enderecoId) {
        await api.patch(`/pedidos/${id}/endereco`, { endereco_id: enderecoId }).catch(() => {});
      }
      navigate('/painel/pedidos');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function salvarObs() {
    setSalvando(true);
    try {
      await api.patch(`/pedidos/${id}/observacao`, { observacao });
      feedback('Observação salva!');
    } catch { setErro('Erro ao salvar observação'); }
    finally { setSalvando(false); }
  }

  if (loading) return <Spinner />;
  if (!pedido) return <Alert type="error">Pedido não encontrado</Alert>;

  const podeEditarItens = ['aguardando_pagamento', 'confirmado'].includes(pedido.status);

  return (
    <div className={styles.page}>
      <button className={styles.voltar} onClick={() => navigate('/painel/pedidos')}>← Voltar</button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Editar pedido {pedido.numero_pedido || '#' + id.slice(0,8).toUpperCase()}</h1>
          <p className={styles.subtitle}>{pedido.cliente_nome} — {pedido.cliente_email}</p>
        </div>
        <Badge color={pedido.status === 'confirmado' ? 'blue' : pedido.status === 'aguardando_pagamento' ? 'yellow' : 'gray'}>
          {pedido.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      {erro    && <Alert type="error">{erro}</Alert>}
      {sucesso && <Alert type="success">{sucesso}</Alert>}

      {/* Observação */}
      <Card className={styles.obsCard}>
        <h3 className={styles.secTitle}>📋 Observação para o cliente</h3>
        <textarea
          className={styles.obsInput} rows={3}
          placeholder="Ex: Substituímos a alface por rúcula devido à disponibilidade..."
          value={observacao} onChange={e => setObservacao(e.target.value)}
        />
        <p className={styles.obsHint}>Esta observação aparece para o cliente na seção de pedidos.</p>
        {!podeEditarItens && (
          <Button loading={salvando} onClick={salvarObs}>Salvar observação</Button>
        )}
      </Card>

      {/* Endereço de entrega — sempre editável */}
      <Card className={styles.obsCard}>
        <div className={styles.endHeader}>
          <h3 className={styles.secTitle}>📍 Endereço de entrega</h3>
          <button className={styles.btnTrocar} onClick={() => setModalEnd(true)}>Trocar endereço</button>
        </div>

        {endSel ? (
          <div className={styles.endSel}>
            <div className={styles.endApelido}>{endSel.apelido}</div>
            <p className={styles.endLine}>{endSel.endereco}, {endSel.numero}{endSel.complemento ? ` ${endSel.complemento}` : ''}</p>
            <p className={styles.endLine}>{endSel.bairro} — {endSel.cidade}/{endSel.estado} · CEP {endSel.cep?.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
            <p className={styles.endZona}>
              Frete: <strong>R$ {parseFloat(endSel.custo_entrega || 0).toFixed(2)}</strong> · {endSel.prazo_dias} dia(s) útil(eis) — {endSel.zona_nome}
            </p>
          </div>
        ) : (
          <p className={styles.obsHint}>Nenhum endereço selecionado.</p>
        )}
      </Card>

      {/* Edição de itens */}
      {podeEditarItens ? (
        <div className={styles.layout}>
          <div>
            <h3 className={styles.secTitle}>Produtos</h3>
            <div className={styles.grid}>
              {produtos.filter(p => p.ativo).map(p => (
                <Card key={p.id} className={styles.prodCard}>
                  <div className={styles.prodImg}>
                    {p.foto_url ? <img src={p.foto_url} alt={p.nome} /> : <span>🛒</span>}
                  </div>
                  <div className={styles.prodInfo}>
                    <div className={styles.prodNome}>{p.nome}</div>
                    <div className={styles.prodEstoque}>
                      Estoque: <strong>{p.estoque_atual}</strong>
                      {p.estoque_atual === 0 && <Badge color="red">Zerado</Badge>}
                    </div>
                    <div className={styles.prodPreco}>R$ {parseFloat(p.preco).toFixed(2)}</div>
                    {p.estoque_atual === 0
                      ? <Badge color="gray">Indisponível</Badge>
                      : carrinho[p.id]
                        ? (
                          <div className={styles.qtdCtrl}>
                            <button onClick={() => remove(p.id)} className={styles.qtdBtn}>−</button>
                            <span className={styles.qtdNum}>{carrinho[p.id]}</span>
                            <button onClick={() => add(p.id)} className={styles.qtdBtn}>+</button>
                          </div>
                        )
                        : <Button size="sm" onClick={() => add(p.id)}>Adicionar</Button>
                    }
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className={styles.aside}>
            <Card className={styles.resumo}>
              <h3 className={styles.secTitle}>Resumo</h3>
              {Object.entries(carrinho).map(([pid, qtd]) => {
                const prod = produtos.find(p => p.id === pid);
                if (!prod) return null;
                return (
                  <div key={pid} className={styles.resumoItem}>
                    <span>{prod.nome} x{qtd}</span>
                    <span>R$ {(parseFloat(prod.preco) * qtd).toFixed(2)}</span>
                  </div>
                );
              })}
              <div className={styles.resumoItem}>
                <span>Frete</span>
                <span>R$ {frete.toFixed(2)}</span>
              </div>
              <div className={styles.resumoTotal}>
                <span>Total</span>
                <span>R$ {totalValor.toFixed(2)}</span>
              </div>
              <Button full loading={salvando} disabled={totalItens === 0} onClick={salvar}>
                Salvar alterações
              </Button>
              <p className={styles.aviso}>⚠️ O estoque será ajustado automaticamente e o cliente será notificado por e-mail.</p>
            </Card>
          </div>
        </div>
      ) : (
        <Alert type="info">
          Este pedido está em <strong>{pedido.status.replace(/_/g, ' ')}</strong> — não é possível alterar os itens. Você ainda pode editar a observação e o endereço acima.
        </Alert>
      )}

      {/* Modal seleção de endereço */}
      <Modal open={modalEnd} onClose={() => setModalEnd(false)} title="Selecionar endereço de entrega">
        <GerenciarEnderecos
          clienteId={pedido.cliente_id}
          modoSelecao
          enderecoSelecionado={enderecoId}
          onSelecionar={(end) => { setEnderecoId(end.id); setModalEnd(false); }}
        />
      </Modal>
    </div>
  );
}
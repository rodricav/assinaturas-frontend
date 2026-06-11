// src/pages/EditarPedidoCliente.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getProdutos } from '../services/api';
import api from '../services/api';
import { Button, Card, Alert, Spinner, Badge } from '../components/ui';
import styles from './EditarAssinatura.module.css'; // reutiliza o mesmo CSS

export default function EditarPedidoCliente() {
  const { id }            = useParams();
  const navigate          = useNavigate();
  const [params]          = useSearchParams();
  const tambemAssinatura  = params.get('tambem_assinatura') === '1';
  const assinaturaId      = params.get('assinatura_id');

  const [pedido, setPedido]       = useState(null);
  const [produtos, setProdutos]   = useState([]);
  const [carrinho, setCarrinho]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState('');
  const [sucesso, setSucesso]     = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/pedidos/${id}`),
      getProdutos(),
    ]).then(([rPedido, rProd]) => {
      const p = rPedido.data;

      // Verifica que o pedido pode ser editado
      if (p.status !== 'aguardando_pagamento') {
        navigate('/pedidos'); return;
      }

      setPedido(p);
      setProdutos(rProd.data);

      // Pré-carrega carrinho com itens atuais
      const c = {};
      (p.itens || []).forEach(item => {
        if (!item.item_em_falta) c[item.produto_id] = item.quantidade;
      });
      setCarrinho(c);
    }).catch(() => setErro('Erro ao carregar pedido'))
    .finally(() => setLoading(false));
  }, [id]);

  const add    = (pid) => setCarrinho(c => ({ ...c, [pid]: (c[pid] || 0) + 1 }));
  const remove = (pid) => setCarrinho(c => {
    const n = { ...c };
    if (n[pid] > 1) n[pid]--; else delete n[pid];
    return n;
  });

  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const subtotal   = Object.entries(carrinho).reduce((acc, [pid, qtd]) => {
    const p = produtos.find(x => x.id === pid);
    return acc + (p ? parseFloat(p.preco) * qtd : 0);
  }, 0);
  const desconto   = pedido ? subtotal * (parseFloat(pedido.desconto || 0) / subtotal || 0) : 0;
  const frete      = pedido ? parseFloat(pedido.custo_entrega || 0) : 0;

  // Recalcula desconto proporcionalmente
  const descontoReal = pedido && pedido.subtotal > 0
    ? subtotal * (parseFloat(pedido.desconto) / parseFloat(pedido.subtotal))
    : 0;
  const total = subtotal - descontoReal + frete;

  async function salvar() {
    if (totalItens === 0) { setErro('Selecione ao menos um produto'); return; }
    setSalvando(true); setErro('');
    try {
      const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));

      // Edita o pedido e recria preferência MP
      const { data } = await api.patch(`/pedidos/${id}/itens-cliente`, { itens });

      // Se deve alterar também a assinatura
      if (tambemAssinatura && assinaturaId) {
        await api.patch(`/assinaturas/${assinaturaId}/itens`, { itens }).catch(() => {});
      }

      setSucesso(`Pedido atualizado! Novo link de pagamento gerado.`);

      // Redireciona para o pagamento após 2s
      setTimeout(() => {
        if (data.init_point) {
          window.location.href = data.init_point;
        } else {
          navigate('/pedidos');
        }
      }, 2000);

    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar alterações');
    } finally { setSalvando(false); }
  }

  if (loading) return <Spinner />;
  if (!pedido)  return <Alert type="error">Pedido não encontrado</Alert>;

  return (
    <div className={styles.page}>
      <button className={styles.voltar} onClick={() => navigate('/pedidos')}>← Voltar</button>

      <div className={styles.header}>
        <h1 className={styles.title}>Alterar pedido</h1>
        <p className={styles.subtitle}>
          {pedido.numero_pedido} · R$ {parseFloat(pedido.total).toFixed(2)} atual
          {tambemAssinatura && <> &nbsp;·&nbsp; <strong>Também alterará a assinatura</strong></>}
        </p>
      </div>

      <Alert type="info">
        Após salvar, um novo link de pagamento será gerado e o anterior será invalidado.
        {tambemAssinatura && ' Seus itens serão salvos também para as próximas entregas.'}
      </Alert>

      {erro    && <Alert type="error">{erro}</Alert>}
      {sucesso && <Alert type="success">{sucesso} Redirecionando para pagamento...</Alert>}

      <div className={styles.layout}>
        <div className={styles.produtos}>
          <h3 className={styles.secTitle}>Produtos disponíveis</h3>
          <div className={styles.grid}>
            {produtos.map(p => (
              <Card key={p.id} className={styles.prodCard}>
                <div className={styles.prodImg}>
                  {p.foto_url ? <img src={p.foto_url} alt={p.nome} /> : <span>🛒</span>}
                </div>
                <div className={styles.prodInfo}>
                  <h4 className={styles.prodNome}>{p.nome}</h4>
                  <span className={styles.prodPreco}>R$ {parseFloat(p.preco).toFixed(2)}</span>
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
            <h3 className={styles.secTitle}>Resumo do pedido</h3>

            {totalItens === 0 ? (
              <p className={styles.vazio}>Nenhum produto selecionado</p>
            ) : (
              <div className={styles.itens}>
                {Object.entries(carrinho).map(([pid, qtd]) => {
                  const prod = produtos.find(p => p.id === pid);
                  if (!prod) return null;
                  return (
                    <div key={pid} className={styles.itemResumo}>
                      <span className={styles.itemNome}>{prod.nome} ×{qtd}</span>
                      <span className={styles.itemVal}>R$ {(parseFloat(prod.preco) * qtd).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {totalItens > 0 && (
              <div className={styles.totais}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {descontoReal > 0 && (
                  <div className={`${styles.totalRow} ${styles.desconto}`}>
                    <span>Desconto</span>
                    <span>− R$ {descontoReal.toFixed(2)}</span>
                  </div>
                )}
                {frete > 0 && (
                  <div className={styles.totalRow}>
                    <span>Frete</span>
                    <span>R$ {frete.toFixed(2)}</span>
                  </div>
                )}
                <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                  <span>Novo total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button full size="lg" loading={salvando}
              disabled={totalItens === 0 || !!sucesso}
              onClick={salvar}>
              {tambemAssinatura ? 'Salvar pedido e assinatura' : 'Salvar pedido'}
            </Button>
            <p className={styles.vazio} style={{ fontSize: 12 }}>
              Você será redirecionado para o novo link de pagamento
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

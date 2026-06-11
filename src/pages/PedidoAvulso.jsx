// src/pages/PedidoAvulso.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProdutos, getEnderecos } from '../services/api';
import api from '../services/api';
import { Button, Card, Alert, Spinner, Badge, Modal } from '../components/ui';
import GerenciarEnderecos from '../components/GerenciarEnderecos';
import styles from './EditarAssinatura.module.css'; // reutiliza CSS

export default function PedidoAvulso() {
  const navigate = useNavigate();

  const [produtos, setProdutos]     = useState([]);
  const [enderecos, setEnderecos]   = useState([]);
  const [carrinho, setCarrinho]     = useState({});
  const [enderecoId, setEnderecoId] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState('');
  const [modalEnd, setModalEnd]     = useState(false);

  useEffect(() => {
    Promise.all([getProdutos(), getEnderecos()])
      .then(([rProd, rEnd]) => {
        setProdutos(rProd.data);
        setEnderecos(rEnd.data);
        const principal = rEnd.data.find(e => e.principal);
        if (principal) setEnderecoId(principal.id);
      })
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

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
  const frete = endSel ? parseFloat(endSel.custo_entrega || 0) : 0;
  const total = subtotal + frete;

  async function confirmar() {
    if (totalItens === 0) { setErro('Selecione ao menos um produto'); return; }
    if (!enderecoId) { setErro('Selecione um endereço de entrega'); return; }
    setSalvando(true); setErro('');
    try {
      const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
      const { data } = await api.post('/pedidos/avulso', { itens, endereco_id: enderecoId });

      // Redireciona direto para o pagamento
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        navigate('/pedidos');
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar pedido');
      setSalvando(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <button className={styles.voltar} onClick={() => navigate('/pedidos')}>← Voltar</button>

      <div className={styles.header}>
        <h1 className={styles.title}>Pedido avulso</h1>
        <p className={styles.subtitle}>Entrega única, sem compromisso de assinatura</p>
      </div>

      <Alert type="info">
        Este pedido será entregue uma vez. Não cria nem altera nenhuma assinatura existente.
      </Alert>

      {erro && <Alert type="error">{erro}</Alert>}

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
            <h3 className={styles.secTitle}>Resumo</h3>

            {/* Endereço */}
            <div className={styles.enderecoBox}>
              <div className={styles.enderecoHeader}>
                <span className={styles.enderecoLabel}>📍 Endereço de entrega</span>
                <button className={styles.btnTrocar} onClick={() => setModalEnd(true)}>Trocar</button>
              </div>
              {endSel ? (
                <div className={styles.enderecoInfo}>
                  <strong>{endSel.apelido}</strong>
                  <span>{endSel.endereco}, {endSel.numero} — {endSel.cidade}/{endSel.estado}</span>
                  <span className={styles.enderecoFrete}>
                    Frete: R$ {parseFloat(endSel.custo_entrega).toFixed(2)} · {endSel.prazo_dias} dia(s) útil(eis)
                  </span>
                </div>
              ) : (
                <p className={styles.vazio}>Nenhum endereço selecionado</p>
              )}
            </div>

            {/* Itens */}
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
                <div className={styles.totalRow}>
                  <span>Frete</span>
                  <span>{endSel ? `R$ ${frete.toFixed(2)}` : <span className={styles.semEnd}>selecione endereço</span>}</span>
                </div>
                <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button full size="lg" loading={salvando}
              disabled={totalItens === 0 || !enderecoId}
              onClick={confirmar}>
              Confirmar e pagar
            </Button>
          </Card>
        </div>
      </div>

      <Modal open={modalEnd} onClose={() => setModalEnd(false)} title="Selecionar endereço">
        <GerenciarEnderecos
          modoSelecao
          enderecoSelecionado={enderecoId}
          onSelecionar={(end) => { setEnderecoId(end.id); setModalEnd(false); }}
        />
      </Modal>
    </div>
  );
}
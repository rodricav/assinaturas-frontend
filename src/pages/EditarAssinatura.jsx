// src/pages/EditarAssinatura.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProdutos, getEnderecos } from '../services/api';
import api from '../services/api';
import { Button, Card, Alert, Spinner, Badge, Modal } from '../components/ui';
import GerenciarEnderecos from '../components/GerenciarEnderecos';
import styles from './EditarAssinatura.module.css';

export default function EditarAssinatura() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [assinatura, setAssinatura]   = useState(null);
  const [produtos, setProdutos]       = useState([]);
  const [enderecos, setEnderecos]     = useState([]);
  const [carrinho, setCarrinho]       = useState({});
  const [enderecoId, setEnderecoId]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [salvando, setSalvando]       = useState(false);
  const [erro, setErro]               = useState('');
  const [aviso, setAviso]             = useState('');
  const [avisoTipo, setAvisoTipo]     = useState('info');
  const [modalEnd, setModalEnd]       = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/assinaturas/minhas'),
      getProdutos(),
      getEnderecos(),
    ]).then(([rAssin, rProd, rEnd]) => {
      const assin = rAssin.data.find(a => a.id === id);
      if (!assin) { navigate('/assinaturas'); return; }

      setAssinatura(assin);
      setProdutos(rProd.data);
      setEnderecos(rEnd.data);

      // Pré-carrega carrinho
      const carrinhoInicial = {};
      (assin.itens || []).forEach(item => {
        carrinhoInicial[item.produto_id] = item.quantidade;
      });
      setCarrinho(carrinhoInicial);

      // Endereço atual da assinatura ou principal
      const endAtual = rEnd.data.find(e => e.id === assin.endereco_id)
                    || rEnd.data.find(e => e.principal);
      if (endAtual) setEnderecoId(endAtual.id);

      // Verifica viabilidade da entrega
      verificarPrazo(assin, endAtual);

    }).catch(() => setErro('Erro ao carregar dados'))
    .finally(() => setLoading(false));
  }, [id]);

  function verificarPrazo(assin, endSel) {
    if (!assin?.proxima_geracao) return;

    const [ano, mes, dia] = assin.proxima_geracao.split('T')[0].split('-').map(Number);
    const proxGeracao = new Date(ano, mes - 1, dia);
    const hoje        = new Date(); hoje.setHours(0, 0, 0, 0);
    const diffDias    = Math.ceil((proxGeracao - hoje) / (1000 * 60 * 60 * 24));
    const prazo       = parseInt(endSel?.prazo_dias || assin.prazo_dias || 1);
    const diasNecessarios = 3 + prazo; // 3 dias de antecedência + prazo de entrega

    if (diffDias < 3) {
      setAviso(`Alterações não são permitidas com menos de 3 dias para a próxima geração (${proxGeracao.toLocaleDateString('pt-BR')}).`);
      setAvisoTipo('error');
    } else if (endSel && diffDias < diasNecessarios) {
      setAviso(`⚠️ Com o endereço selecionado (prazo: ${prazo} dia${prazo > 1 ? 's' : ''}), a entrega pode não ser viável — a geração do pedido é em ${diffDias} dia${diffDias > 1 ? 's' : ''} e precisaria de ao menos ${diasNecessarios}. Considere escolher um endereço com prazo menor ou aguardar o próximo ciclo.`);
      setAvisoTipo('warning');
    } else {
      setAviso('');
      setAvisoTipo('info');
    }
  }

  function handleSelecionarEndereco(end) {
    setEnderecoId(end.id);
    setModalEnd(false);
    verificarPrazo(assinatura, end);
  }

  const add    = (pid) => setCarrinho(c => ({ ...c, [pid]: (c[pid] || 0) + 1 }));
  const remove = (pid) => setCarrinho(c => {
    const n = { ...c };
    if (n[pid] > 1) n[pid]--; else delete n[pid];
    return n;
  });

  const endSel     = enderecos.find(e => e.id === enderecoId);
  const bloqueado  = avisoTipo === 'error';
  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const subtotal   = Object.entries(carrinho).reduce((acc, [pid, qtd]) => {
    const p = produtos.find(x => x.id === pid);
    return acc + (p ? parseFloat(p.preco) * qtd : 0);
  }, 0);
  const frete      = endSel ? parseFloat(endSel.custo_entrega || 0) : 0;
  const desconto   = assinatura ? subtotal * (parseFloat(assinatura.desconto_pct || 0) / 100) : 0;
  const total      = subtotal - desconto + frete;

  // Data de entrega estimada
  function dataEntregaEstimada() {
    if (!assinatura?.proxima_geracao || !endSel) return null;
    const [ano, mes, dia] = assinatura.proxima_geracao.split('T')[0].split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    d.setDate(d.getDate() + parseInt(endSel.prazo_dias || 1));
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  async function salvar() {
    if (totalItens === 0) { setErro('Selecione ao menos um produto'); return; }
    setSalvando(true); setErro('');
    try {
      const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
      await api.patch(`/assinaturas/${id}/itens`, { itens });

      // Atualiza endereço se mudou
      if (enderecoId && enderecoId !== assinatura.endereco_id) {
        await api.patch(`/assinaturas/${id}/endereco`, { endereco_id: enderecoId }).catch(() => {});
      }

      navigate('/assinaturas', { state: { sucesso: 'Assinatura atualizada com sucesso!' } });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar alterações');
    } finally { setSalvando(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <button className={styles.voltar} onClick={() => navigate('/assinaturas')}>← Voltar</button>

      <div className={styles.header}>
        <h1 className={styles.title}>Alterar assinatura</h1>
        <p className={styles.subtitle}>
          Próxima geração: <strong>{(() => {
            if (!assinatura?.proxima_geracao) return '—';
            const [ano, mes, dia] = assinatura.proxima_geracao.split('T')[0].split('-').map(Number);
            return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR');
          })()}</strong>
          {dataEntregaEstimada() && (
            <> &nbsp;·&nbsp; Estimativa de entrega: <strong style={{ textTransform: 'capitalize' }}>{dataEntregaEstimada()}</strong></>
          )}
        </p>
      </div>

      {aviso && <Alert type={avisoTipo === 'warning' ? 'info' : avisoTipo}>{aviso}</Alert>}
      {!aviso && <Alert type="info">Alterações são permitidas até 3 dias antes da próxima geração do pedido.</Alert>}
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
                      : (
                        <Button size="sm" onClick={() => add(p.id)} disabled={bloqueado}>
                          Adicionar
                        </Button>
                      )
                  }
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className={styles.aside}>
          <Card className={styles.resumo}>
            <h3 className={styles.secTitle}>Resumo</h3>

            {/* Endereço de entrega */}
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

            {/* Totais */}
            {totalItens > 0 && (
              <div className={styles.totais}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {desconto > 0 && (
                  <div className={`${styles.totalRow} ${styles.desconto}`}>
                    <span>Desconto ({assinatura.desconto_pct}%)</span>
                    <span>− R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span>Frete</span>
                  <span>{endSel ? `R$ ${frete.toFixed(2)}` : <span className={styles.semEnd}>selecione endereço</span>}</span>
                </div>
                <div className={`${styles.totalRow} ${styles.totalFinal}`}>
                  <span>Total estimado</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button full size="lg" loading={salvando}
              disabled={totalItens === 0 || bloqueado}
              onClick={salvar}>
              Salvar alterações
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal endereços */}
      <Modal open={modalEnd} onClose={() => setModalEnd(false)} title="Selecionar endereço de entrega">
        <GerenciarEnderecos
          modoSelecao
          enderecoSelecionado={enderecoId}
          onSelecionar={handleSelecionarEndereco}
        />
      </Modal>
    </div>
  );
}
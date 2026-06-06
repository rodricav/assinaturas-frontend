// src/pages/Catalogo.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProdutos } from '../services/api';
import api from '../services/api';
import { Button, Card, Badge, Spinner, EmptyState } from '../components/ui';
import styles from './Catalogo.module.css';

export default function Catalogo() {
  const [produtos, setProdutos]   = useState([]);
  const [planos, setPlanos]       = useState([]);
  const [carrinho, setCarrinho]   = useState({});
  const [planoSel, setPlanoSel]   = useState('');
  const [dataInicio, setData]     = useState('');
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    setData(amanha.toISOString().split('T')[0]);

    Promise.all([
      getProdutos(),
      api.get('/planos'),
    ]).then(([rProd, rPlanos]) => {
      setProdutos(rProd.data);
      setPlanos(rPlanos.data);
      if (rPlanos.data.length) setPlanoSel(rPlanos.data[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const add    = (id) => setCarrinho(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const remove = (id) => setCarrinho(c => {
    const n = { ...c };
    if (n[id] > 1) n[id]--; else delete n[id];
    return n;
  });

  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const totalValor = Object.entries(carrinho).reduce((acc, [id, qtd]) => {
    const p = produtos.find(x => x.id === id);
    return acc + (p ? parseFloat(p.preco) * qtd : 0);
  }, 0);

  const planoAtual = planos.find(p => p.id === planoSel);
  const desconto   = planoAtual ? totalValor * (parseFloat(planoAtual.desconto_pct) / 100) : 0;

  function irParaConfirmacao() {
    const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
    navigate('/assinar', { state: { plano_id: planoSel, data_inicio: dataInicio, itens } });
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Catálogo</h1>
          <p className={styles.subtitle}>Escolha os produtos da sua assinatura</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.grid}>
          {produtos.length === 0 && (
            <EmptyState icon="🌿" title="Nenhum produto disponível" desc="Em breve novos itens serão adicionados." />
          )}
          {produtos.map(p => (
            <Card key={p.id} className={styles.prodCard}>
              <div className={styles.prodImg}>
                {p.foto_url ? <img src={p.foto_url} alt={p.nome} /> : <span className={styles.prodEmoji}>🛒</span>}
              </div>
              <div className={styles.prodInfo}>
                <h3 className={styles.prodNome}>{p.nome}</h3>
                {p.descricao && <p className={styles.prodDesc}>{p.descricao}</p>}
                <div className={styles.prodFooter}>
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
              </div>
            </Card>
          ))}
        </div>

        <div className={styles.aside}>
          <Card className={styles.asideCard}>
            <h3 className={styles.asideTitle}>Sua assinatura</h3>

            <div className={styles.asideSection}>
              <label className={styles.asideLabel}>Periodicidade</label>
              <div className={styles.planos}>
                {planos.map(p => (
                  <button key={p.id} onClick={() => setPlanoSel(p.id)}
                    className={`${styles.planoBtn} ${planoSel === p.id ? styles.planoBtnActive : ''}`}
                  >
                    <span className={styles.planoNome}>{p.nome} — {p.intervalo_dias} dias</span>
                    {parseFloat(p.desconto_pct) > 0 && <Badge color="green">{p.desconto_pct}% off</Badge>}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.asideSection}>
              <label className={styles.asideLabel}>Primeira entrega</label>
              <input
                type="date" value={dataInicio}
                onChange={e => setData(e.target.value)}
                className={styles.dateInput}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {totalItens > 0 && (
              <div className={styles.resumo}>
                <div className={styles.resumoRow}>
                  <span>Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})</span>
                  <span>R$ {totalValor.toFixed(2)}</span>
                </div>
                {desconto > 0 && (
                  <div className={`${styles.resumoRow} ${styles.resumoDesconto}`}>
                    <span>Desconto do plano</span>
                    <span>− R$ {desconto.toFixed(2)}</span>
                  </div>
                )}
                <div className={`${styles.resumoRow} ${styles.resumoTotal}`}>
                  <span>Total por entrega</span>
                  <span>R$ {(totalValor - desconto).toFixed(2)}</span>
                </div>
              </div>
            )}

            <Button
              full size="lg"
              disabled={totalItens === 0 || !planoSel || !dataInicio}
              onClick={irParaConfirmacao}
            >
              {totalItens === 0 ? 'Adicione produtos' : `Revisar — R$ ${(totalValor - desconto).toFixed(2)}`}
            </Button>

            {totalItens === 0 && (
              <p className={styles.asideHint}>Selecione ao menos um produto para continuar</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

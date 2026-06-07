// src/pages/EditarAssinatura.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProdutos } from '../services/api';
import api from '../services/api';
import { Button, Card, Alert, Spinner, Badge } from '../components/ui';
import styles from './EditarAssinatura.module.css';

export default function EditarAssinatura() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [assinatura, setAssinatura] = useState(null);
  const [produtos, setProdutos]     = useState([]);
  const [carrinho, setCarrinho]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [erro, setErro]             = useState('');
  const [aviso3dias, setAviso3dias] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/assinaturas/minhas'),
      getProdutos(),
    ]).then(([rAssin, rProd]) => {
      const assin = rAssin.data.find(a => a.id === id);
      if (!assin) { navigate('/assinaturas'); return; }

      setAssinatura(assin);
      setProdutos(rProd.data);

      // Pré-carrega o carrinho com os itens atuais
      const carrinhoInicial = {};
      (assin.itens || []).forEach(item => {
        carrinhoInicial[item.produto_id] = item.quantidade;
      });
      setCarrinho(carrinhoInicial);

      // Verifica 3 dias de antecedência
      const hoje        = new Date();
      const proxGeracao = new Date(assin.proxima_geracao);
      const diffDias    = (proxGeracao - hoje) / (1000 * 60 * 60 * 24);
      if (diffDias < 3) {
        setAviso3dias(`Alterações não são permitidas com menos de 3 dias para a próxima geração (${new Date(assin.proxima_geracao).toLocaleDateString('pt-BR')}). Você pode alterar a partir de ${new Date(proxGeracao.getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}.`);
      }
    }).catch(() => setErro('Erro ao carregar dados'))
    .finally(() => setLoading(false));
  }, [id]);

  const add    = (pid) => setCarrinho(c => ({ ...c, [pid]: (c[pid] || 0) + 1 }));
  const remove = (pid) => setCarrinho(c => {
    const n = { ...c };
    if (n[pid] > 1) n[pid]--; else delete n[pid];
    return n;
  });

  const totalItens = Object.values(carrinho).reduce((a, b) => a + b, 0);

  async function salvar() {
    if (totalItens === 0) { setErro('Selecione ao menos um produto'); return; }
    setSalvando(true); setErro('');
    try {
      const itens = Object.entries(carrinho).map(([produto_id, quantidade]) => ({ produto_id, quantidade }));
      await api.patch(`/assinaturas/${id}/itens`, { itens });
      navigate('/assinaturas', { state: { sucesso: 'Assinatura atualizada com sucesso!' } });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <button className={styles.voltar} onClick={() => navigate('/assinaturas')}>← Voltar</button>

      <div className={styles.header}>
        <h1 className={styles.title}>Alterar assinatura</h1>
        <p className={styles.subtitle}>
          Próxima entrega: <strong>{new Date(assinatura?.proxima_geracao).toLocaleDateString('pt-BR')}</strong>
        </p>
      </div>

      {aviso3dias && (
        <Alert type="error">{aviso3dias}</Alert>
      )}

      {!aviso3dias && (
        <Alert type="info">
          Alterações são permitidas até 3 dias antes da próxima geração do pedido.
        </Alert>
      )}

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
                        <Button size="sm" onClick={() => add(p.id)} disabled={!!aviso3dias}>
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
            <h3 className={styles.secTitle}>Novos itens</h3>
            {totalItens === 0 ? (
              <p className={styles.vazio}>Nenhum produto selecionado</p>
            ) : (
              <div className={styles.itens}>
                {Object.entries(carrinho).map(([pid, qtd]) => {
                  const prod = produtos.find(p => p.id === pid);
                  if (!prod) return null;
                  return (
                    <div key={pid} className={styles.itemResumo}>
                      <span className={styles.itemNome}>{prod.nome}</span>
                      <span className={styles.itemQtd}>x{qtd}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <Button
              full size="lg"
              loading={salvando}
              disabled={totalItens === 0 || !!aviso3dias}
              onClick={salvar}
            >
              Salvar alterações
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

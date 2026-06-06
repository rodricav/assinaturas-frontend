// src/pages/ConfirmarAssinatura.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProdutos } from '../services/api';
import api from '../services/api';
import { Button, Card, Alert, Spinner } from '../components/ui';
import styles from './ConfirmarAssinatura.module.css';

export default function ConfirmarAssinatura() {
  const { state }       = useLocation();
  const navigate        = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [planos, setPlanos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');
  const [sucesso, setSucesso]   = useState(false);

  // Se chegou sem state (acesso direto), volta ao catálogo
  useEffect(() => {
    if (!state?.itens) { navigate('/'); return; }

    Promise.all([
      getProdutos(),
      api.get('/planos'),
    ]).then(([rProd, rPlanos]) => {
      setProdutos(rProd.data);
      setPlanos(rPlanos.data);
    }).catch(() => {
      setErro('Erro ao carregar dados. Tente novamente.');
    }).finally(() => setLoading(false));
  }, []);

  if (!state?.itens) return null;
  if (loading) return <Spinner />;

  const { plano_id, data_inicio, itens } = state;

  const plano = planos.find(p => p.id === plano_id);

  const itensDetalhados = itens.map(item => {
    const prod = produtos.find(p => p.id === item.produto_id);
    return { ...item, nome: prod?.nome, preco: prod?.preco, foto_url: prod?.foto_url };
  });

  const subtotal  = itensDetalhados.reduce((acc, i) => acc + parseFloat(i.preco || 0) * i.quantidade, 0);
  const desconto  = plano ? subtotal * (parseFloat(plano.desconto_pct) / 100) : 0;
  const total     = subtotal - desconto;

  const dataFormatada = new Date(data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  async function confirmar() {
    setSalvando(true); setErro('');
    try {
      await api.post('/assinaturas', { plano_id, data_inicio, itens });
      setSucesso(true);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar assinatura. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  if (sucesso) {
    return (
      <div className={styles.sucessoWrap}>
        <div className={styles.sucessoCard}>
          <div className={styles.sucessoIcon}>🎉</div>
          <h2 className={styles.sucessoTitulo}>Assinatura confirmada!</h2>
          <p className={styles.sucessoDesc}>
            Sua primeira entrega está prevista para <strong>{dataFormatada}</strong>.<br />
            Você receberá uma confirmação pelo WhatsApp.
          </p>
          <div className={styles.sucessoActions}>
            <Button onClick={() => navigate('/assinaturas')} size="lg">
              Ver minhas assinaturas
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Continuar no catálogo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.voltar} onClick={() => navigate('/')}>← Voltar ao catálogo</button>

      <div className={styles.header}>
        <h1 className={styles.title}>Confirmar assinatura</h1>
        <p className={styles.subtitle}>Revise os detalhes antes de confirmar</p>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.layout}>
        {/* Resumo do pedido */}
        <div className={styles.main}>

          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>📦 Produtos selecionados</h3>
            <div className={styles.itens}>
              {itensDetalhados.map(item => (
                <div key={item.produto_id} className={styles.item}>
                  <div className={styles.itemImg}>
                    {item.foto_url ? <img src={item.foto_url} alt={item.nome} /> : '🛒'}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemNome}>{item.nome}</span>
                    <span className={styles.itemQtd}>Quantidade: {item.quantidade}</span>
                  </div>
                  <span className={styles.itemPreco}>
                    R$ {(parseFloat(item.preco) * item.quantidade).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>🔄 Plano e periodicidade</h3>
            <div className={styles.planoInfo}>
              <div className={styles.planoDetalhe}>
                <span className={styles.planoLabel}>Plano selecionado</span>
                <span className={styles.planoVal}>{plano?.nome}</span>
              </div>
              <div className={styles.planoDetalhe}>
                <span className={styles.planoLabel}>Frequência</span>
                <span className={styles.planoVal}>A cada {plano?.intervalo_dias} dias</span>
              </div>
              <div className={styles.planoDetalhe}>
                <span className={styles.planoLabel}>Primeira entrega</span>
                <span className={styles.planoVal}>{dataFormatada}</span>
              </div>
              {parseFloat(plano?.desconto_pct) > 0 && (
                <div className={styles.planoDetalhe}>
                  <span className={styles.planoLabel}>Desconto do plano</span>
                  <span className={`${styles.planoVal} ${styles.verde}`}>{plano.desconto_pct}% de desconto</span>
                </div>
              )}
            </div>
          </Card>

        </div>

        {/* Resumo financeiro */}
        <div className={styles.aside}>
          <Card className={styles.resumoCard}>
            <h3 className={styles.sectionTitle}>Resumo financeiro</h3>

            <div className={styles.resumoLinhas}>
              <div className={styles.resumoLinha}>
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {desconto > 0 && (
                <div className={`${styles.resumoLinha} ${styles.verde}`}>
                  <span>Desconto ({plano?.desconto_pct}%)</span>
                  <span>− R$ {desconto.toFixed(2)}</span>
                </div>
              )}
              <div className={styles.resumoLinha}>
                <span>Frete</span>
                <span className={styles.cinza}>Calculado na entrega</span>
              </div>
              <div className={`${styles.resumoLinha} ${styles.resumoTotal}`}>
                <span>Total por entrega</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.aviso}>
              💳 O pagamento será cobrado automaticamente a cada entrega, após a geração do pedido.
            </div>

            <Button full size="lg" loading={salvando} onClick={confirmar}>
              Confirmar assinatura
            </Button>
            <Button full variant="ghost" onClick={() => navigate('/')}>
              Cancelar
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

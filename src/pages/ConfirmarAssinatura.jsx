// src/pages/ConfirmarAssinatura.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProdutos, getEnderecos } from '../services/api';
import api from '../services/api';
import { Button, Card, Alert, Spinner, Modal } from '../components/ui';
import GerenciarEnderecos from '../components/GerenciarEnderecos';
import styles from './ConfirmarAssinatura.module.css';

export default function ConfirmarAssinatura() {
  const { state }   = useLocation();
  const navigate    = useNavigate();

  const [produtos, setProdutos]         = useState([]);
  const [planos, setPlanos]             = useState([]);
  const [enderecos, setEnderecos]       = useState([]);
  const [enderecoId, setEnderecoId]     = useState(null);
  const [loading, setLoading]           = useState(true);
  const [salvando, setSalvando]         = useState(false);
  const [erro, setErro]                 = useState('');
  const [sucesso, setSucesso]           = useState(false);
  const [modalEnd, setModalEnd]         = useState(false);

  useEffect(() => {
    if (!state?.itens) { navigate('/'); return; }

    Promise.all([
      getProdutos(),
      api.get('/planos'),
      getEnderecos(),
    ]).then(([rProd, rPlanos, rEnd]) => {
      setProdutos(rProd.data);
      setPlanos(rPlanos.data);
      setEnderecos(rEnd.data);
      // Seleciona endereço principal por padrão
      const principal = rEnd.data.find(e => e.principal);
      if (principal) setEnderecoId(principal.id);
    }).catch(() => setErro('Erro ao carregar dados. Tente novamente.'))
    .finally(() => setLoading(false));
  }, []);

  if (!state?.itens) return null;
  if (loading) return <Spinner />;

  const { plano_id, data_inicio, itens } = state;
  const plano    = planos.find(p => p.id === plano_id);
  const endSel   = enderecos.find(e => e.id === enderecoId);

  const itensDetalhados = itens.map(item => {
    const prod = produtos.find(p => p.id === item.produto_id);
    return { ...item, nome: prod?.nome, preco: prod?.preco, foto_url: prod?.foto_url };
  });

  const subtotal  = itensDetalhados.reduce((acc, i) => acc + parseFloat(i.preco || 0) * i.quantidade, 0);
  const desconto  = plano ? subtotal * (parseFloat(plano.desconto_pct) / 100) : 0;
  const frete     = endSel ? parseFloat(endSel.custo_entrega) : 0;
  const total     = subtotal - desconto + frete;

  const dataFormatada = new Date(data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  async function confirmar() {
    if (!enderecoId) { setErro('Selecione um endereço de entrega'); return; }
    setSalvando(true); setErro('');
    try {
      await api.post('/assinaturas', { plano_id, data_inicio, itens, endereco_id: enderecoId });
      setSucesso(true);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar assinatura. Tente novamente.');
    } finally { setSalvando(false); }
  }

  if (sucesso) {
    return (
      <div className={styles.sucessoWrap}>
        <div className={styles.sucessoCard}>
          <div className={styles.sucessoIcon}>🎉</div>
          <h2 className={styles.sucessoTitulo}>Assinatura confirmada!</h2>
          <p className={styles.sucessoDesc}>
            Sua primeira entrega está prevista para <strong>{dataFormatada}</strong>.<br />
            Você receberá uma confirmação por e-mail.
          </p>
          <div className={styles.sucessoActions}>
            <Button onClick={() => navigate('/assinaturas')} size="lg">Ver minhas assinaturas</Button>
            <Button variant="ghost" onClick={() => navigate('/')}>Continuar no catálogo</Button>
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
        <div className={styles.main}>

          {/* Produtos */}
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

          {/* Plano */}
          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>🔄 Plano e periodicidade</h3>
            <div className={styles.planoInfo}>
              <div className={styles.planoDetalhe}>
                <span className={styles.planoLabel}>Plano</span>
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
                  <span className={styles.planoLabel}>Desconto</span>
                  <span className={`${styles.planoVal} ${styles.verde}`}>{plano.desconto_pct}% off</span>
                </div>
              )}
            </div>
          </Card>

          {/* Endereço de entrega */}
          <Card className={styles.section}>
            <div className={styles.endHeader}>
              <h3 className={styles.sectionTitle}>📍 Endereço de entrega</h3>
              <button className={styles.btnTrocar} onClick={() => setModalEnd(true)}>
                Trocar endereço
              </button>
            </div>

            {endSel ? (
              <div className={styles.endSel}>
                <div className={styles.endApelido}>{endSel.apelido}</div>
                <p className={styles.endLine}>{endSel.endereco}, {endSel.numero}{endSel.complemento ? ` ${endSel.complemento}` : ''}</p>
                <p className={styles.endLine}>{endSel.bairro} — {endSel.cidade}/{endSel.estado} · CEP {endSel.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
                <p className={styles.endZona}>
                  📦 {endSel.zona_nome} · frete R$ {parseFloat(endSel.custo_entrega).toFixed(2)} · {endSel.prazo_dias} dia(s) útil(eis)
                </p>
              </div>
            ) : (
              <Alert type="error">Nenhum endereço cadastrado. <button className={styles.btnLink} onClick={() => setModalEnd(true)}>Adicionar endereço</button></Alert>
            )}
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
                <span>{endSel ? `R$ ${frete.toFixed(2)}` : <span className={styles.cinza}>Selecione o endereço</span>}</span>
              </div>
              <div className={`${styles.resumoLinha} ${styles.resumoTotal}`}>
                <span>Total por entrega</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className={styles.aviso}>
              💳 O pagamento será cobrado automaticamente a cada entrega, após a geração do pedido.
            </div>

            <Button full size="lg" loading={salvando} disabled={!enderecoId} onClick={confirmar}>
              Confirmar assinatura
            </Button>
            <Button full variant="ghost" onClick={() => navigate('/')}>Cancelar</Button>
          </Card>
        </div>
      </div>

      {/* Modal seleção/adição de endereço */}
      <Modal open={modalEnd} onClose={() => setModalEnd(false)} title="Selecionar endereço de entrega">
        <GerenciarEnderecos
          modoSelecao
          enderecoSelecionado={enderecoId}
          onSelecionar={(end) => { setEnderecoId(end.id); setModalEnd(false); }}
        />
      </Modal>
    </div>
  );
}

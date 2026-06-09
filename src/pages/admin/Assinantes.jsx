// src/pages/admin/Assinantes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssinantes } from '../../services/api';
import api from '../../services/api';
import { Card, Badge, Spinner, Alert, Button, Input, Modal } from '../../components/ui';
import GerenciarEnderecos from '../../components/GerenciarEnderecos';
import styles from './Assinantes.module.css';

export default function Assinantes() {
  const [assinantes, setAssinantes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState('');
  const [busca, setBusca]           = useState('');
  const [clienteSel, setClienteSel] = useState(null);
  const [aba, setAba]               = useState('dados'); // 'dados' | 'enderecos'
  const [salvando, setSalvando]     = useState(false);
  const [formDados, setFormDados]   = useState({ nome: '', telefone: '' });
  const navigate = useNavigate();

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const { data } = await getAssinantes();
      setAssinantes(data);
    } catch { setErro('Erro ao carregar'); }
    finally { setLoading(false); }
  }

  function abrirCliente(a) {
    setClienteSel(a);
    setFormDados({ nome: a.nome, telefone: a.telefone });
    setAba('dados');
    setSucesso(''); setErro('');
  }

  async function salvarDados(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      await api.patch(`/admin/clientes/${clienteSel.id}`, formDados);
      setSucesso('Dados atualizados!');
      await carregar();
      setClienteSel(a => ({ ...a, ...formDados }));
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  const filtrados = assinantes.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assinantes</h1>
          <p className={styles.subtitle}>{assinantes.length} cliente(s) cadastrado(s)</p>
        </div>
        <input
          className={styles.busca} placeholder="Buscar por nome ou e-mail..."
          value={busca} onChange={e => setBusca(e.target.value)}
        />
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.tabela}>
        <div className={styles.thead}>
          <span>Cliente</span>
          <span>Contato</span>
          <span>Assinaturas ativas</span>
          <span>Próxima entrega</span>
          <span></span>
        </div>
        {filtrados.map(a => (
          <Card key={a.id} className={styles.row}>
            <div className={styles.cliente}>
              <div className={styles.avatar}>{a.nome[0].toUpperCase()}</div>
              <div>
                <div className={styles.nome}>{a.nome}</div>
                <div className={styles.cidade}>{a.cidade}, {a.estado}</div>
              </div>
            </div>
            <div className={styles.contato}>
              <div className={styles.email}>{a.email}</div>
              <div className={styles.tel}>{a.telefone}</div>
            </div>
            <div>
              {parseInt(a.assinaturas_ativas) > 0
                ? <Badge color="green">{a.assinaturas_ativas} ativa(s)</Badge>
                : <Badge color="gray">Nenhuma</Badge>
              }
            </div>
            <div className={styles.proxima}>
              {a.proxima_geracao
                ? new Date(a.proxima_geracao).toLocaleDateString('pt-BR')
                : '—'}
            </div>
            <div>
              <Button size="sm" variant="ghost" onClick={() => abrirCliente(a)}>
                ✏️ Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de edição do cliente */}
      <Modal
        open={!!clienteSel}
        onClose={() => setClienteSel(null)}
        title={`Editar cliente — ${clienteSel?.nome}`}
      >
        <div className={styles.modalWrap}>
          {/* Abas */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${aba === 'dados' ? styles.tabAtivo : ''}`} onClick={() => setAba('dados')}>
              👤 Dados
            </button>
            <button className={`${styles.tab} ${aba === 'enderecos' ? styles.tabAtivo : ''}`} onClick={() => setAba('enderecos')}>
              📍 Endereços
            </button>
          </div>

          {sucesso && <Alert type="success">{sucesso}</Alert>}
          {erro    && <Alert type="error">{erro}</Alert>}

          {aba === 'dados' && (
            <form onSubmit={salvarDados} className={styles.form}>
              <Input label="Nome completo" value={formDados.nome}
                onChange={e => setFormDados(f => ({ ...f, nome: e.target.value }))} required />
              <Input label="Telefone" value={formDados.telefone}
                onChange={e => setFormDados(f => ({ ...f, telefone: e.target.value }))} required />
              <div className={styles.campoInfo}>
                <span className={styles.campoLabel}>E-mail</span>
                <span className={styles.campoVal}>{clienteSel?.email}</span>
              </div>
              <div className={styles.campoInfo}>
                <span className={styles.campoLabel}>Cidade</span>
                <span className={styles.campoVal}>{clienteSel?.cidade}/{clienteSel?.estado}</span>
              </div>
              <Button type="submit" loading={salvando}>Salvar dados</Button>
            </form>
          )}

          {aba === 'enderecos' && clienteSel && (
            <div className={styles.endWrap}>
              <p className={styles.endDesc}>Gerencie os endereços de entrega deste cliente.</p>
              <GerenciarEnderecos clienteId={clienteSel.id} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
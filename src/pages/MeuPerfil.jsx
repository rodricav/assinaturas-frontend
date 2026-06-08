// src/pages/MeuPerfil.jsx
import { useState, useEffect } from 'react';
import { getPerfil } from '../services/api';
import api from '../services/api';
import { Button, Input, Alert, Spinner, Card } from '../components/ui';
import styles from './MeuPerfil.module.css';

export default function MeuPerfil() {
  const [perfil, setPerfil]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState('');
  const [sucesso, setSucesso]     = useState('');
  const [abaAtiva, setAba]        = useState('dados'); // 'dados' | 'endereco' | 'senha'

  const [formDados, setFormDados] = useState({ nome: '', telefone: '' });
  const [formEnd, setFormEnd]     = useState({
    cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP'
  });
  const [formSenha, setFormSenha] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });

  useEffect(() => {
    getPerfil().then(r => {
      setPerfil(r.data);
      setFormDados({ nome: r.data.nome, telefone: r.data.telefone });
      setFormEnd({
        cep:         r.data.cep || '',
        endereco:    r.data.endereco || '',
        numero:      r.data.numero || '',
        complemento: r.data.complemento || '',
        bairro:      r.data.bairro || '',
        cidade:      r.data.cidade || '',
        estado:      r.data.estado || 'SP',
      });
    }).catch(() => setErro('Erro ao carregar perfil'))
    .finally(() => setLoading(false));
  }, []);

  function feedback(msg, tipo = 'sucesso') {
    if (tipo === 'sucesso') { setSucesso(msg); setErro(''); }
    else { setErro(msg); setSucesso(''); }
    setTimeout(() => { setSucesso(''); setErro(''); }, 4000);
  }

  async function salvarDados(e) {
    e.preventDefault(); setSalvando(true);
    try {
      const { data } = await api.patch('/clientes/me', formDados);
      setPerfil(p => ({ ...p, ...data }));
      feedback('Dados atualizados com sucesso!');
    } catch (err) {
      feedback(err.response?.data?.erro || 'Erro ao salvar', 'erro');
    } finally { setSalvando(false); }
  }

  async function salvarEndereco(e) {
    e.preventDefault(); setSalvando(true);
    try {
      const cepLimpo = formEnd.cep.replace(/\D/g, '');

      // Valida CEP primeiro
      const { data: zonaData } = await api.get(`/clientes/validar-cep/${cepLimpo}`);
      if (!zonaData.atendido) {
        feedback('CEP fora da área de entrega.', 'erro');
        setSalvando(false); return;
      }

      const { data } = await api.patch('/clientes/me', { ...formEnd, cep: cepLimpo });
      setPerfil(p => ({ ...p, ...data }));
      feedback('Endereço atualizado! Zona: ' + zonaData.zona.nome);
    } catch (err) {
      feedback(err.response?.data?.erro || 'Erro ao salvar endereço', 'erro');
    } finally { setSalvando(false); }
  }

  async function salvarSenha(e) {
    e.preventDefault();
    if (formSenha.novaSenha !== formSenha.confirmar) {
      feedback('As senhas não coincidem.', 'erro'); return;
    }
    if (formSenha.novaSenha.length < 6) {
      feedback('Nova senha deve ter ao menos 6 caracteres.', 'erro'); return;
    }
    setSalvando(true);
    try {
      await api.patch('/clientes/me/senha', {
        senhaAtual: formSenha.senhaAtual,
        novaSenha:  formSenha.novaSenha,
      });
      setFormSenha({ senhaAtual: '', novaSenha: '', confirmar: '' });
      feedback('Senha alterada com sucesso!');
    } catch (err) {
      feedback(err.response?.data?.erro || 'Erro ao alterar senha', 'erro');
    } finally { setSalvando(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{perfil?.nome?.[0]?.toUpperCase()}</div>
        <div>
          <h1 className={styles.title}>{perfil?.nome}</h1>
          <p className={styles.email}>{perfil?.email}</p>
          {perfil?.zona_nome && (
            <p className={styles.zona}>📍 {perfil.zona_nome} · frete R$ {parseFloat(perfil.custo_entrega).toFixed(2)} · {perfil.prazo_dias} dia(s)</p>
          )}
        </div>
      </div>

      {sucesso && <Alert type="success">{sucesso}</Alert>}
      {erro    && <Alert type="error">{erro}</Alert>}

      {/* Abas */}
      <div className={styles.tabs}>
        {[
          { key: 'dados',    label: '👤 Dados pessoais' },
          { key: 'endereco', label: '📍 Endereço' },
          { key: 'senha',    label: '🔒 Senha' },
        ].map(a => (
          <button key={a.key}
            className={`${styles.tab} ${abaAtiva === a.key ? styles.tabAtivo : ''}`}
            onClick={() => setAba(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Dados pessoais */}
      {abaAtiva === 'dados' && (
        <Card>
          <form onSubmit={salvarDados} className={styles.form}>
            <Input label="Nome completo" value={formDados.nome}
              onChange={e => setFormDados(f => ({ ...f, nome: e.target.value }))} required />
            <Input label="Telefone" value={formDados.telefone}
              onChange={e => setFormDados(f => ({ ...f, telefone: e.target.value }))} required />
            <div className={styles.campo}>
              <label className={styles.label}>E-mail</label>
              <p className={styles.campoVal}>{perfil?.email} <span className={styles.campoNote}>(não editável)</span></p>
            </div>
            <Button type="submit" loading={salvando}>Salvar dados</Button>
          </form>
        </Card>
      )}

      {/* Endereço */}
      {abaAtiva === 'endereco' && (
        <Card>
          <form onSubmit={salvarEndereco} className={styles.form}>
            <Input label="CEP" value={formEnd.cep}
              onChange={e => setFormEnd(f => ({ ...f, cep: e.target.value }))}
              required placeholder="13480-100" maxLength={9} />
            <div className={styles.row2}>
              <Input label="Endereço" value={formEnd.endereco}
                onChange={e => setFormEnd(f => ({ ...f, endereco: e.target.value }))} required />
              <Input label="Número" value={formEnd.numero}
                onChange={e => setFormEnd(f => ({ ...f, numero: e.target.value }))} required />
            </div>
            <div className={styles.row2}>
              <Input label="Complemento" value={formEnd.complemento}
                onChange={e => setFormEnd(f => ({ ...f, complemento: e.target.value }))} />
              <Input label="Bairro" value={formEnd.bairro}
                onChange={e => setFormEnd(f => ({ ...f, bairro: e.target.value }))} required />
            </div>
            <div className={styles.row2}>
              <Input label="Cidade" value={formEnd.cidade}
                onChange={e => setFormEnd(f => ({ ...f, cidade: e.target.value }))} required />
              <Input label="Estado" value={formEnd.estado}
                onChange={e => setFormEnd(f => ({ ...f, estado: e.target.value }))} required maxLength={2} />
            </div>
            <Alert type="info">Ao alterar o CEP, verificaremos se a nova região é atendida.</Alert>
            <Button type="submit" loading={salvando}>Salvar endereço</Button>
          </form>
        </Card>
      )}

      {/* Senha */}
      {abaAtiva === 'senha' && (
        <Card>
          <form onSubmit={salvarSenha} className={styles.form}>
            <Input label="Senha atual" type="password" value={formSenha.senhaAtual}
              onChange={e => setFormSenha(f => ({ ...f, senhaAtual: e.target.value }))} required />
            <Input label="Nova senha" type="password" value={formSenha.novaSenha}
              onChange={e => setFormSenha(f => ({ ...f, novaSenha: e.target.value }))}
              required placeholder="mínimo 6 caracteres" />
            <Input label="Confirmar nova senha" type="password" value={formSenha.confirmar}
              onChange={e => setFormSenha(f => ({ ...f, confirmar: e.target.value }))} required />
            <Button type="submit" loading={salvando}>Alterar senha</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

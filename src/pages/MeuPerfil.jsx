// src/pages/MeuPerfil.jsx
import { useState, useEffect } from 'react';
import { getPerfil } from '../services/api';
import api from '../services/api';
import { Button, Input, Alert, Spinner, Card } from '../components/ui';
import GerenciarEnderecos from '../components/GerenciarEnderecos';
import styles from './MeuPerfil.module.css';

export default function MeuPerfil() {
  const [perfil, setPerfil]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState('');
  const [sucesso, setSucesso]     = useState('');
  const [abaAtiva, setAba]        = useState('dados');

  const [formDados, setFormDados] = useState({ nome: '', telefone: '' });
  const [formSenha, setFormSenha] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });

  useEffect(() => {
    getPerfil().then(r => {
      setPerfil(r.data);
      setFormDados({ nome: r.data.nome, telefone: r.data.telefone });
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
      await api.patch('/clientes/me', formDados);
      feedback('Dados atualizados com sucesso!');
    } catch (err) {
      feedback(err.response?.data?.erro || 'Erro ao salvar', 'erro');
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
        </div>
      </div>

      {sucesso && <Alert type="success">{sucesso}</Alert>}
      {erro    && <Alert type="error">{erro}</Alert>}

      <div className={styles.tabs}>
        {[
          { key: 'dados',      label: '👤 Dados pessoais' },
          { key: 'enderecos',  label: '📍 Endereços' },
          { key: 'senha',      label: '🔒 Senha' },
        ].map(a => (
          <button key={a.key}
            className={`${styles.tab} ${abaAtiva === a.key ? styles.tabAtivo : ''}`}
            onClick={() => setAba(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>

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

      {abaAtiva === 'enderecos' && (
        <Card>
          <p className={styles.endDesc}>Você pode ter até 3 endereços. Na hora de criar uma assinatura você escolhe qual usar.</p>
          <GerenciarEnderecos />
        </Card>
      )}

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

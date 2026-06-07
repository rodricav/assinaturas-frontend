// src/pages/LoginAdmin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAdmin, criarAdmin } from '../services/api';
import { Button, Input, Alert } from '../components/ui';
import styles from './LoginAdmin.module.css';

export default function LoginAdmin() {
  const [modo, setModo]       = useState('login'); // 'login' | 'criar'
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const { entrar }            = useAuth();
  const navigate              = useNavigate();

  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const { data } = await loginAdmin({ email: form.email, senha: form.senha });
      entrar(data.token, { nome: data.nome, email: form.email, papel: 'admin' });
      navigate('/painel');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Credenciais inválidas');
    } finally { setLoading(false); }
  }

  async function handleCriar(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      await criarAdmin(form);
      // Faz login automático após criar
      const { data } = await loginAdmin({ email: form.email, senha: form.senha });
      entrar(data.token, { nome: data.nome, email: form.email, papel: 'admin' });
      navigate('/painel');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao criar administrador');
    } finally { setLoading(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>⚙️</div>
        <h1 className={styles.title}>Painel administrativo</h1>
        <p className={styles.subtitle}>AssínaSaas</p>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${modo === 'login' ? styles.tabActive : ''}`} onClick={() => { setModo('login'); setErro(''); }}>
            Entrar
          </button>
          <button className={`${styles.tab} ${modo === 'criar' ? styles.tabActive : ''}`} onClick={() => { setModo('criar'); setErro(''); }}>
            Criar admin
          </button>
        </div>

        {erro && <Alert type="error">{erro}</Alert>}

        {modo === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <Input label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="admin@empresa.com" />
            <Input label="Senha" type="password" value={form.senha} onChange={e => set('senha', e.target.value)} required placeholder="••••••" />
            <Button type="submit" loading={loading} full size="lg">Entrar no painel</Button>
          </form>
        ) : (
          <form onSubmit={handleCriar} className={styles.form}>
            <Alert type="info">Use esta opção apenas para criar o primeiro administrador.</Alert>
            <Input label="Nome" value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Seu nome" />
            <Input label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
            <Input label="Senha" type="password" value={form.senha} onChange={e => set('senha', e.target.value)} required placeholder="mínimo 6 caracteres" />
            <Button type="submit" loading={loading} full size="lg">Criar administrador</Button>
          </form>
        )}

        <button className={styles.voltarLink} onClick={() => navigate('/login')}>
          ← Voltar para área do cliente
        </button>
      </div>
    </div>
  );
}

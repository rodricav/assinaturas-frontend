// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, cadastrar } from '../services/api';
import { Button, Input, Alert } from '../components/ui';
import styles from './Login.module.css';

export default function Login() {
  const [modo, setModo]       = useState('login'); // 'login' | 'cadastro'
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState('');
  const [zona, setZona]       = useState(null);
  const { entrar }            = useAuth();
  const navigate              = useNavigate();

  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', senha: '', cpf: '',
    cep: '', endereco: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: 'SP',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const { data } = await login({ email: form.email, senha: form.senha });
      entrar(data.token, { nome: data.nome, email: form.email });
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  async function handleCadastro(e) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const cepLimpo = form.cep.replace(/\D/g, '');
      const { data } = await cadastrar({ ...form, cep: cepLimpo, cpf: form.cpf.replace(/\D/g, '') || undefined });
      setZona(data.zona);
      entrar('', { nome: data.cliente.nome, email: data.cliente.email });
      // Faz login automático
      const { data: loginData } = await login({ email: form.email, senha: form.senha });
      entrar(loginData.token, { nome: data.cliente.nome, email: data.cliente.email });
      navigate('/');
    } catch (err) {
      setErro(err.response?.data?.erro || err.response?.data?.mensagem || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.logo}>🌿</div>
          <h1 className={styles.brandName}>Assina<span>Saas</span></h1>
          <p className={styles.brandTagline}>Produtos frescos na sua porta, toda semana.</p>
        </div>
        <div className={styles.features}>
          {['Escolha seus produtos favoritos', 'Receba a cada 15 ou 30 dias', 'Cancele quando quiser'].map(f => (
            <div key={f} className={styles.feature}>
              <span className={styles.featureCheck}>✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formCard}>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${modo === 'login' ? styles.tabActive : ''}`} onClick={() => { setModo('login'); setErro(''); }}>
              Entrar
            </button>
            <button className={`${styles.tab} ${modo === 'cadastro' ? styles.tabActive : ''}`} onClick={() => { setModo('cadastro'); setErro(''); }}>
              Criar conta
            </button>
          </div>

          {erro && <Alert type="error">{erro}</Alert>}

          {modo === 'login' ? (
            <form onSubmit={handleLogin} className={styles.form}>
              <Input label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="seu@email.com" />
              <Input label="Senha" type="password" value={form.senha} onChange={e => set('senha', e.target.value)} required placeholder="••••••" />
              <Button type="submit" loading={loading} full size="lg">Entrar</Button>
              <button type="button" className={styles.adminLink} onClick={() => navigate('/admin')}>
                Acesso administrativo →
              </button>
            </form>
          ) : (
            <form onSubmit={handleCadastro} className={styles.form}>
              <div className={styles.row2}>
                <Input label="Nome completo" value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Maria Silva" />
                <Input label="CPF (opcional)" value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className={styles.row2}>
                <Input label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                <Input label="Telefone (WhatsApp)" value={form.telefone} onChange={e => set('telefone', e.target.value)} required placeholder="19999990000" />
              </div>
              <Input label="Senha" type="password" value={form.senha} onChange={e => set('senha', e.target.value)} required placeholder="mínimo 6 caracteres" />
              <div className={styles.divider}>Endereço de entrega</div>
              <div className={styles.row3}>
                <Input label="CEP" value={form.cep} onChange={e => set('cep', e.target.value)} required placeholder="13480-100" />
                <Input label="Endereço" value={form.endereco} onChange={e => set('endereco', e.target.value)} required placeholder="Rua das Flores" />
                <Input label="Número" value={form.numero} onChange={e => set('numero', e.target.value)} required placeholder="100" />
              </div>
              <div className={styles.row3}>
                <Input label="Complemento" value={form.complemento} onChange={e => set('complemento', e.target.value)} placeholder="Apto 2" />
                <Input label="Bairro" value={form.bairro} onChange={e => set('bairro', e.target.value)} required />
                <Input label="Cidade" value={form.cidade} onChange={e => set('cidade', e.target.value)} required />
              </div>
              <Button type="submit" loading={loading} full size="lg">Criar minha conta</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

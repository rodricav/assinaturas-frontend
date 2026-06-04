// src/pages/admin/Zonas.jsx
import { useState, useEffect } from 'react';
import { getZonas, criarZona, editarZona } from '../../services/api';
import { Card, Button, Input, Badge, Spinner, Alert, Modal } from '../../components/ui';
import styles from './Zonas.module.css';

export default function Zonas() {
  const [zonas, setZonas]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState('');
  const [modal, setModal]     = useState(false);
  const [sel, setSel]         = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm]       = useState({ nome: '', cep_inicio: '', cep_fim: '', custo_entrega: '', prazo_dias: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function carregar() {
    try { const { data } = await getZonas(); setZonas(data); }
    catch { setErro('Erro ao carregar zonas'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  function abrir(zona = null) {
    setSel(zona);
    setForm(zona
      ? { nome: zona.nome, cep_inicio: zona.cep_inicio, cep_fim: zona.cep_fim, custo_entrega: zona.custo_entrega, prazo_dias: zona.prazo_dias }
      : { nome: '', cep_inicio: '', cep_fim: '', custo_entrega: '', prazo_dias: '' }
    );
    setModal(true);
  }

  async function salvar(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const dados = {
        ...form,
        cep_inicio: form.cep_inicio.replace(/\D/g, ''),
        cep_fim:    form.cep_fim.replace(/\D/g, ''),
        custo_entrega: parseFloat(form.custo_entrega),
        prazo_dias:    parseInt(form.prazo_dias),
      };
      if (sel) await editarZona(sel.id, dados);
      else     await criarZona(dados);
      setModal(false); await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar zona');
    } finally { setSalvando(false); }
  }

  async function toggleAtiva(zona) {
    try { await editarZona(zona.id, { ativa: !zona.ativa }); await carregar(); }
    catch { setErro('Erro ao alterar zona'); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zonas de entrega</h1>
          <p className={styles.subtitle}>Configure as faixas de CEP atendidas</p>
        </div>
        <Button onClick={() => abrir()}>+ Nova zona</Button>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.lista}>
        {zonas.map(z => (
          <Card key={z.id} className={styles.card}>
            <div className={styles.cardLeft}>
              <div className={styles.cardTop}>
                <h3 className={styles.zonaNome}>{z.nome}</h3>
                <Badge color={z.ativa ? 'green' : 'gray'}>{z.ativa ? 'Ativa' : 'Inativa'}</Badge>
              </div>
              <div className={styles.cepRange}>
                <span className={styles.cep}>{z.cep_inicio.replace(/(\d{5})(\d{3})/, '$1-$2')}</span>
                <span className={styles.cepSep}>→</span>
                <span className={styles.cep}>{z.cep_fim.replace(/(\d{5})(\d{3})/, '$1-$2')}</span>
              </div>
            </div>
            <div className={styles.cardRight}>
              <div className={styles.stat}>
                <span className={styles.statVal}>R$ {parseFloat(z.custo_entrega).toFixed(2)}</span>
                <span className={styles.statLabel}>frete</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal}>{z.prazo_dias}d</span>
                <span className={styles.statLabel}>prazo</span>
              </div>
              <div className={styles.actions}>
                <Button size="sm" variant="ghost" onClick={() => abrir(z)}>Editar</Button>
                <Button size="sm" variant={z.ativa ? 'danger' : 'secondary'} onClick={() => toggleAtiva(z)}>
                  {z.ativa ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={sel ? 'Editar zona' : 'Nova zona de entrega'}>
        <form onSubmit={salvar} className={styles.form}>
          <Input label="Nome da zona" value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Ex: Limeira e Região" />
          <div className={styles.row2}>
            <Input label="CEP início" value={form.cep_inicio} onChange={e => set('cep_inicio', e.target.value)} required placeholder="13480000" maxLength={9} />
            <Input label="CEP fim" value={form.cep_fim} onChange={e => set('cep_fim', e.target.value)} required placeholder="13489999" maxLength={9} />
          </div>
          <div className={styles.row2}>
            <Input label="Custo de entrega (R$)" type="number" step="0.01" value={form.custo_entrega} onChange={e => set('custo_entrega', e.target.value)} required />
            <Input label="Prazo (dias úteis)" type="number" value={form.prazo_dias} onChange={e => set('prazo_dias', e.target.value)} required />
          </div>
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" loading={salvando}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

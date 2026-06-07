// src/pages/admin/Categorias.jsx
import { useState, useEffect } from 'react';
import { getCategorias, criarCategoria, editarCategoria } from '../../services/api';
import { Card, Button, Input, Badge, Spinner, Alert, Modal } from '../../components/ui';
import styles from './Categorias.module.css';

const EMOJIS = ['🍎','🥦','🥕','🌿','🧺','🍋','🥑','🫐','🍇','🥝','🌽','🍅','🧅','🧄','🥬','🫑','🍊','🍓','🫒','🥥'];

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState('');
  const [modal, setModal]           = useState(false);
  const [sel, setSel]               = useState(null);
  const [salvando, setSalvando]     = useState(false);
  const [form, setForm]             = useState({ nome: '', descricao: '', icone: '🛒', ordem: 0 });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function carregar() {
    try { const { data } = await getCategorias(); setCategorias(data); }
    catch { setErro('Erro ao carregar categorias'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  function abrir(cat = null) {
    setSel(cat);
    setForm(cat
      ? { nome: cat.nome, descricao: cat.descricao || '', icone: cat.icone || '🛒', ordem: cat.ordem }
      : { nome: '', descricao: '', icone: '🛒', ordem: categorias.length + 1 }
    );
    setModal(true);
  }

  async function salvar(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const dados = { ...form, ordem: parseInt(form.ordem) };
      if (sel) await editarCategoria(sel.id, dados);
      else     await criarCategoria(dados);
      setModal(false); await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function toggleAtiva(cat) {
    try { await editarCategoria(cat.id, { ativa: !cat.ativa }); await carregar(); }
    catch { setErro('Erro ao alterar categoria'); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categorias</h1>
          <p className={styles.subtitle}>Organize os produtos por categoria no catálogo</p>
        </div>
        <Button onClick={() => abrir()}>+ Nova categoria</Button>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.lista}>
        {categorias.map(cat => (
          <Card key={cat.id} className={styles.card}>
            <div className={styles.cardLeft}>
              <div className={styles.icone}>{cat.icone}</div>
              <div>
                <div className={styles.nome}>{cat.nome}</div>
                {cat.descricao && <div className={styles.desc}>{cat.descricao}</div>}
              </div>
            </div>
            <div className={styles.cardRight}>
              <div className={styles.ordem}>Ordem: {cat.ordem}</div>
              <Badge color={cat.ativa ? 'green' : 'gray'}>{cat.ativa ? 'Ativa' : 'Inativa'}</Badge>
              <div className={styles.actions}>
                <Button size="sm" variant="ghost" onClick={() => abrir(cat)}>Editar</Button>
                <Button size="sm" variant={cat.ativa ? 'danger' : 'secondary'} onClick={() => toggleAtiva(cat)}>
                  {cat.ativa ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={sel ? 'Editar categoria' : 'Nova categoria'}>
        <form onSubmit={salvar} className={styles.form}>
          <div className={styles.row2}>
            <Input label="Nome" value={form.nome} onChange={e => set('nome', e.target.value)} required placeholder="Ex: Frutas" />
            <Input label="Ordem de exibição" type="number" value={form.ordem} onChange={e => set('ordem', e.target.value)} />
          </div>
          <Input label="Descrição (opcional)" value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Ex: Frutas frescas da estação" />

          <div className={styles.emojiField}>
            <label className={styles.emojiLabel}>Ícone</label>
            <div className={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <button key={e} type="button"
                  className={`${styles.emojiBtn} ${form.icone === e ? styles.emojiBtnAtivo : ''}`}
                  onClick={() => set('icone', e)}
                >
                  {e}
                </button>
              ))}
            </div>
            <div className={styles.emojiSel}>Selecionado: <strong>{form.icone}</strong></div>
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

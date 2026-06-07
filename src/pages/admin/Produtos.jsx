// src/pages/admin/Produtos.jsx
import { useState, useEffect } from 'react';
import { getProdutosAdmin, criarProduto, editarProduto, ajustarEstoque, getCategorias } from '../../services/api';
import { Card, Button, Input, Badge, Spinner, Alert, Modal } from '../../components/ui';
import styles from './Produtos.module.css';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState('');
  const [modal, setModal]       = useState(null); // 'criar' | 'estoque'
  const [sel, setSel]           = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [categorias, setCategorias] = useState([]);

  const [form, setForm] = useState({ nome: '', descricao: '', preco: '', foto_url: '', ordem: 0, ativo: true, categoria_id: '' });
  const [estoqueQtd, setEstoqueQtd]   = useState('');
  const [estoqueObs, setEstoqueObs]   = useState('');
  const [estoqueMot, setEstoqueMot]   = useState('entrada_manual');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function carregar() {
    try {
      const { data } = await getProdutosAdmin();
      setProdutos(data);
    } catch { setErro('Erro ao carregar produtos'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); getCategorias().then(r => setCategorias(r.data)).catch(() => {}); }, []);

  function abrirCriar() {
    setForm({ nome: '', descricao: '', preco: '', foto_url: '', ordem: 0, ativo: true });
    setSel(null); setModal('criar');
  }

  function abrirEditar(p) {
    setForm({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, foto_url: p.foto_url || '', ordem: p.ordem, ativo: p.ativo, categoria_id: p.categoria_id || '' });
    setSel(p); setModal('criar');
  }

  function abrirEstoque(p) {
    setSel(p); setEstoqueQtd(''); setEstoqueObs(''); setModal('estoque');
  }

  async function salvarProduto(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const dados = { ...form, preco: parseFloat(form.preco), ordem: parseInt(form.ordem) };
      if (sel) await editarProduto(sel.id, dados);
      else     await criarProduto(dados);
      setModal(null); await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar produto');
    } finally { setSalvando(false); }
  }

  async function salvarEstoque(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const qtd = parseInt(estoqueQtd);
      await ajustarEstoque(sel.id, { quantidade: qtd, motivo: estoqueMot, observacao: estoqueObs });
      setModal(null); await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao ajustar estoque');
    } finally { setSalvando(false); }
  }

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Produtos</h1>
          <p className={styles.subtitle}>{produtos.length} produto(s) cadastrado(s)</p>
        </div>
        <Button onClick={abrirCriar}>+ Novo produto</Button>
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.grid}>
        {produtos.map(p => (
          <Card key={p.id} className={styles.card}>
            <div className={styles.cardImg}>
              {p.foto_url ? <img src={p.foto_url} alt={p.nome} /> : <span>🛒</span>}
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <h3 className={styles.prodNome}>{p.nome}</h3>
                <Badge color={p.ativo ? 'green' : 'gray'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              <p className={styles.prodPreco}>R$ {parseFloat(p.preco).toFixed(2)}</p>
              <div className={styles.estoque}>
                <span className={styles.estoqueNum}>{p.estoque_atual}</span>
                <span className={styles.estoqueLabel}>em estoque</span>
                {p.estoque_atual <= p.estoque_minimo && <Badge color="red">Baixo</Badge>}
              </div>
              <div className={styles.cardActions}>
                <Button size="sm" variant="ghost" onClick={() => abrirEditar(p)}>Editar</Button>
                <Button size="sm" variant="secondary" onClick={() => abrirEstoque(p)}>Estoque</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal criar/editar */}
      <Modal open={modal === 'criar'} onClose={() => setModal(null)} title={sel ? 'Editar produto' : 'Novo produto'}>
        <form onSubmit={salvarProduto} className={styles.form}>
          <Input label="Nome" value={form.nome} onChange={e => set('nome', e.target.value)} required />
          <Input label="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)} />
          <div className={styles.row2}>
            <Input label="Preço (R$)" type="number" step="0.01" value={form.preco} onChange={e => set('preco', e.target.value)} required />
            <Input label="Ordem de exibição" type="number" value={form.ordem} onChange={e => set('ordem', e.target.value)} />
          </div>
          <Input label="URL da foto" value={form.foto_url} onChange={e => set('foto_url', e.target.value)} placeholder="https://..." />
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Categoria</label>
            <select className={styles.select} value={form.categoria_id} onChange={e => set('categoria_id', e.target.value || null)}>
              <option value="">Sem categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
            </select>
          </div>
          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.ativo} onChange={e => set('ativo', e.target.checked)} />
            Produto ativo no catálogo
          </label>
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" loading={salvando}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal estoque */}
      <Modal open={modal === 'estoque'} onClose={() => setModal(null)} title={`Estoque — ${sel?.nome}`}>
        <form onSubmit={salvarEstoque} className={styles.form}>
          <p className={styles.estoqueAtual}>Saldo atual: <strong>{sel?.estoque_atual}</strong> unidades</p>
          <Input
            label="Quantidade (positivo = entrada, negativo = saída)"
            type="number" value={estoqueQtd}
            onChange={e => setEstoqueQtd(e.target.value)} required
            placeholder="Ex: 50 ou -10"
          />
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Motivo</label>
            <select className={styles.select} value={estoqueMot} onChange={e => setEstoqueMot(e.target.value)}>
              <option value="entrada_manual">Entrada manual</option>
              <option value="ajuste_manual">Ajuste manual</option>
              <option value="devolucao">Devolução</option>
            </select>
          </div>
          <Input label="Observação" value={estoqueObs} onChange={e => setEstoqueObs(e.target.value)} />
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" loading={salvando}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

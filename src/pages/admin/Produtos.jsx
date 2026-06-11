// src/pages/admin/Produtos.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProdutosAdmin, criarProduto, editarProduto, ajustarEstoque, getCategorias, getPedidosPorProduto } from '../../services/api';
import { Card, Button, Input, Badge, Spinner, Alert, Modal } from '../../components/ui';
import styles from './Produtos.module.css';

const CLOUD_NAME    = 'ddhyk7nat';
const UPLOAD_PRESET = 'au0f8iuw';

const formVazio = { nome: '', descricao: '', preco: '', foto_url: '', ordem: 0, ativo: true, categoria_id: '' };

const STATUS_LABEL = {
  aguardando_pagamento: { label: 'Aguardando pagamento', color: 'yellow' },
  confirmado:           { label: 'Confirmado',           color: 'blue'   },
  em_separacao:         { label: 'Em separação',         color: 'purple' },
  saiu_para_entrega:    { label: 'Saiu para entrega',    color: 'orange' },
};

export default function Produtos() {
  const [produtos, setProdutos]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState('');
  const [modal, setModal]           = useState(null);
  const [sel, setSel]               = useState(null);
  const [salvando, setSalvando]     = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [preview, setPreview]       = useState('');
  const [uploadando, setUploadando] = useState(false);

  const [form, setForm]             = useState(formVazio);
  const [estoqueQtd, setEstoqueQtd] = useState('');
  const [estoqueObs, setEstoqueObs] = useState('');
  const [estoqueMot, setEstoqueMot] = useState('entrada_manual');

  // Estado do modal de pedidos
  const [pedidosProduto, setPedidosProduto]       = useState([]);
  const [loadingPedidos, setLoadingPedidos]       = useState(false);

  const inputFileRef = useRef(null);
  const navigate     = useNavigate();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function carregar() {
    try {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        getProdutosAdmin(),
        getCategorias(),
      ]);
      setProdutos(prods);
      setCategorias(cats);
    } catch { setErro('Erro ao carregar produtos'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  function abrirCriar() {
    setForm(formVazio); setSel(null); setPreview(''); setErro(''); setModal('criar');
  }

  function abrirEditar(p) {
    setForm({
      nome:         p.nome,
      descricao:    p.descricao || '',
      preco:        p.preco,
      foto_url:     p.foto_url || '',
      ordem:        p.ordem ?? 0,
      ativo:        p.ativo,
      categoria_id: p.categoria_id || '',
    });
    setPreview(p.foto_url || '');
    setSel(p); setErro(''); setModal('criar');
  }

  function abrirEstoque(p) {
    setSel(p); setEstoqueQtd(''); setEstoqueObs(''); setModal('estoque');
  }

  async function abrirPedidos(p) {
    setSel(p);
    setPedidosProduto([]);
    setModal('pedidos');
    setLoadingPedidos(true);
    try {
      const { data } = await getPedidosPorProduto(p.id);
      setPedidosProduto(data);
    } catch {
      setErro('Erro ao carregar pedidos do produto');
    } finally {
      setLoadingPedidos(false);
    }
  }

  // Upload para Cloudinary
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErro('Imagem deve ter no máximo 5MB'); return;
    }

    setUploadando(true); setErro('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'paparica/produtos');

      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body:   formData,
      });
      const data = await res.json();

      if (data.secure_url) {
        set('foto_url', data.secure_url);
        setPreview(data.secure_url);
      } else {
        setErro('Erro ao fazer upload da imagem');
      }
    } catch {
      setErro('Erro ao fazer upload. Tente novamente.');
    } finally {
      setUploadando(false);
      if (inputFileRef.current) inputFileRef.current.value = '';
    }
  }

  async function salvarProduto(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const dados = {
        nome:         form.nome.trim(),
        descricao:    form.descricao.trim() || null,
        preco:        parseFloat(form.preco),
        foto_url:     form.foto_url.trim() || null,
        ordem:        parseInt(form.ordem) || 0,
        ativo:        form.ativo,
        categoria_id: form.categoria_id || null,
      };

      if (isNaN(dados.preco) || dados.preco <= 0) {
        setErro('Informe um preço válido'); setSalvando(false); return;
      }

      if (sel && modal === 'criar') await editarProduto(sel.id, dados);
      else                          await criarProduto(dados);

      setModal(null); await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || err.response?.data?.message || 'Erro ao salvar produto');
    } finally { setSalvando(false); }
  }

  async function salvarEstoque(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const qtd = parseInt(estoqueQtd);
      if (isNaN(qtd)) { setErro('Quantidade inválida'); setSalvando(false); return; }
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
              {p.foto_url
                ? <img src={p.foto_url} alt={p.nome}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                : null}
              <span style={{ display: p.foto_url ? 'none' : 'flex' }}>🛒</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardTop}>
                <h3 className={styles.prodNome}>{p.nome}</h3>
                <Badge color={p.ativo ? 'green' : 'gray'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
              </div>
              {p.categoria_nome && <p className={styles.catNome}>{p.categoria_icone} {p.categoria_nome}</p>}
              <p className={styles.prodPreco}>R$ {parseFloat(p.preco).toFixed(2)}</p>
              <div className={styles.estoque}>
                <span className={styles.estoqueNum}>{p.estoque_atual}</span>
                <span className={styles.estoqueLabel}>em estoque</span>
                {p.estoque_atual <= p.estoque_minimo && <Badge color="red">Baixo</Badge>}
              </div>
              <div className={styles.cardActions}>
                <Button size="sm" variant="ghost" onClick={() => abrirEditar(p)}>Editar</Button>
                <Button size="sm" variant="secondary" onClick={() => abrirEstoque(p)}>Estoque</Button>
                <Button size="sm" variant="ghost" onClick={() => abrirPedidos(p)}>
                  Ver pedidos
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal criar/editar */}
      <Modal open={modal === 'criar'} onClose={() => setModal(null)} title={sel ? 'Editar produto' : 'Novo produto'}>
        <form onSubmit={salvarProduto} className={styles.form}>
          {erro && <Alert type="error">{erro}</Alert>}

          <Input label="Nome" value={form.nome}
            onChange={e => set('nome', e.target.value)} required />
          <Input label="Descrição" value={form.descricao}
            onChange={e => set('descricao', e.target.value)} />

          <div className={styles.row2}>
            <Input label="Preço (R$)" type="number" step="0.01" min="0.01"
              value={form.preco} onChange={e => set('preco', e.target.value)} required />
            <Input label="Ordem de exibição" type="number" min="0"
              value={form.ordem} onChange={e => set('ordem', e.target.value)} />
          </div>

          {/* Upload de foto */}
          <div className={styles.fotoWrap}>
            <label className={styles.fieldLabel}>Foto do produto</label>

            {preview && (
              <div className={styles.fotoPreview}>
                <img src={preview} alt="preview" onError={() => setPreview('')} />
                <button type="button" className={styles.fotoRemover}
                  onClick={() => { setPreview(''); set('foto_url', ''); }}>
                  ✕
                </button>
              </div>
            )}

            <div className={styles.fotoAcoes}>
              <button type="button" className={styles.btnUpload}
                onClick={() => inputFileRef.current?.click()}
                disabled={uploadando}>
                {uploadando ? '⏳ Enviando...' : '📁 Escolher arquivo'}
              </button>
              <input
                ref={inputFileRef} type="file"
                accept="image/*" style={{ display: 'none' }}
                onChange={handleUpload}
              />
              <span className={styles.fotoOu}>ou</span>
              <Input
                placeholder="Cole uma URL..."
                value={form.foto_url}
                onChange={e => { set('foto_url', e.target.value); setPreview(e.target.value); }}
              />
            </div>
            <p className={styles.fotoHint}>JPG, PNG, WebP — máx. 5MB</p>
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Categoria</label>
            <select className={styles.select} value={form.categoria_id}
              onChange={e => set('categoria_id', e.target.value)}>
              <option value="">Sem categoria</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
              ))}
            </select>
          </div>

          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.ativo}
              onChange={e => set('ativo', e.target.checked)} />
            Produto ativo no catálogo
          </label>

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" loading={salvando} disabled={uploadando}>Salvar</Button>
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
            <select className={styles.select} value={estoqueMot}
              onChange={e => setEstoqueMot(e.target.value)}>
              <option value="entrada_manual">Entrada manual</option>
              <option value="ajuste_manual">Ajuste manual</option>
              <option value="devolucao">Devolução</option>
            </select>
          </div>
          <Input label="Observação" value={estoqueObs}
            onChange={e => setEstoqueObs(e.target.value)} />
          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" loading={salvando}>Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal pedidos por produto */}
      <Modal
        open={modal === 'pedidos'}
        onClose={() => setModal(null)}
        title={`Pedidos com "${sel?.nome}"`}
      >
        <div className={styles.pedidosModal}>
          {loadingPedidos ? (
            <Spinner />
          ) : pedidosProduto.length === 0 ? (
            <p className={styles.pedidosVazio}>
              Nenhum pedido ativo contém este produto no momento.
            </p>
          ) : (
            <>
              <p className={styles.pedidosTotal}>
                {pedidosProduto.length} pedido{pedidosProduto.length > 1 ? 's' : ''} ativo{pedidosProduto.length > 1 ? 's' : ''}
              </p>
              <div className={styles.pedidosList}>
                {pedidosProduto.map(p => {
                  const st = STATUS_LABEL[p.pedido_status] || { label: p.pedido_status, color: 'gray' };
                  return (
                    <div key={p.pedido_id} className={styles.pedidoRow}>
                      <div className={styles.pedidoInfo}>
                        <div className={styles.pedidoTopo}>
                          <span className={styles.pedidoNumero}>{p.numero_pedido}</span>
                          <Badge color={st.color}>{st.label}</Badge>
                          {p.avulso && <Badge color="gray">Avulso</Badge>}
                        </div>
                        <span className={styles.pedidoCliente}>👤 {p.cliente_nome}</span>
                        {p.cliente_telefone && (
                          <span className={styles.pedidoTel}>📱 {p.cliente_telefone}</span>
                        )}
                        <div className={styles.pedidoMeta}>
                          <span>Qtd: <strong>{p.quantidade}</strong></span>
                          {p.data_entrega_prevista && (
                            <span>
                              Entrega prevista:{' '}
                              <strong>
                                {new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR')}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setModal(null);
                          navigate(`/painel/pedidos/${p.pedido_id}/editar`);
                        }}
                      >
                        Editar pedido
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

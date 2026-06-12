// src/pages/admin/ProdutosMassa.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getCategorias } from '../../services/api';
import { Button, Spinner, Alert, Badge } from '../../components/ui';
import styles from './ProdutosMassa.module.css';

const LINHA_VAZIA = () => ({
  _key:                    crypto.randomUUID(),
  id:                      null, // null = novo produto
  nome:                    '',
  preco:                   '',
  categoria_id:            '',
  unidade_comercial:       'UN',
  codigo_ncm:              '',
  cfop:                    '5102',
  icms_origem:             '0',
  icms_situacao_tributaria:'102',
  codigo_produto:          '',
  cest:                    '',
  ativo:                   true,
  ordem:                   0,
  _modificado:             true,
  _novo:                   true,
});

const CFOP_OPCOES = [
  { value: '5102', label: '5102 — Venda dentro do estado' },
  { value: '6102', label: '6102 — Venda fora do estado' },
  { value: '5405', label: '5405 — Venda com ST' },
  { value: '6404', label: '6404 — Venda interestadual com ST' },
];

const CST_OPCOES = [
  { value: '102', label: '102 — Simples, sem crédito' },
  { value: '103', label: '103 — Simples, isenção' },
  { value: '300', label: '300 — Imune' },
  { value: '400', label: '400 — Tributado normalmente' },
  { value: '500', label: '500 — Com ST retida anteriormente' },
];

const ORIGEM_OPCOES = [
  { value: '0', label: '0 — Nacional' },
  { value: '1', label: '1 — Estrangeira (importação direta)' },
  { value: '2', label: '2 — Estrangeira (adquirida no mercado interno)' },
];

export default function ProdutosMassa() {
  const [linhas, setLinhas]         = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [resultado, setResultado]   = useState(null);
  const [erro, setErro]             = useState('');
  const [fiscalExpandido, setFiscalExpandido] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/produtos/admin'),
      getCategorias(),
    ]).then(([rProd, rCat]) => {
      setCategorias(rCat.data);
      setLinhas(rProd.data.map(p => ({
        _key:                    p.id,
        id:                      p.id,
        nome:                    p.nome || '',
        preco:                   p.preco || '',
        categoria_id:            p.categoria_id || '',
        unidade_comercial:       p.unidade_comercial || 'UN',
        codigo_ncm:              p.codigo_ncm || '',
        cfop:                    p.cfop || '5102',
        icms_origem:             p.icms_origem || '0',
        icms_situacao_tributaria:p.icms_situacao_tributaria || '102',
        codigo_produto:          p.codigo_produto || '',
        cest:                    p.cest || '',
        ativo:                   p.ativo,
        ordem:                   p.ordem ?? 0,
        _modificado:             false,
        _novo:                   false,
      })));
    }).catch(() => setErro('Erro ao carregar produtos'))
    .finally(() => setLoading(false));
  }, []);

  function atualizar(key, campo, valor) {
    setLinhas(ls => ls.map(l =>
      l._key === key ? { ...l, [campo]: valor, _modificado: true } : l
    ));
  }

  function adicionarLinha() {
    setLinhas(ls => [...ls, LINHA_VAZIA()]);
  }

  function removerLinha(key) {
    setLinhas(ls => ls.filter(l => l._key !== key));
  }

  async function salvar() {
    setErro(''); setResultado(null);

    const modificados = linhas.filter(l => l._modificado);
    if (modificados.length === 0) {
      setErro('Nenhuma alteração detectada.');
      return;
    }

    // Validação mínima no frontend
    const invalidos = modificados.filter(l => !l.nome.trim() || !l.preco || isNaN(parseFloat(l.preco)));
    if (invalidos.length > 0) {
      setErro(`${invalidos.length} linha(s) com nome ou preço inválido.`);
      return;
    }

    setSalvando(true);
    try {
      const payload = modificados.map(l => ({
        ...(l.id ? { id: l.id } : {}),
        nome:                    l.nome.trim(),
        preco:                   parseFloat(l.preco),
        ativo:                   l.ativo,
        ordem:                   parseInt(l.ordem) || 0,
        categoria_id:            l.categoria_id || null,
        codigo_produto:          l.codigo_produto || null,
        codigo_ncm:              l.codigo_ncm || null,
        cfop:                    l.cfop || '5102',
        unidade_comercial:       l.unidade_comercial || 'UN',
        icms_origem:             l.icms_origem || '0',
        icms_situacao_tributaria:l.icms_situacao_tributaria || '102',
        cest:                    l.cest || null,
      }));

      const { data } = await api.post('/produtos/massa', payload);
      setResultado(data);

      // Marca todas as linhas como não modificadas
      setLinhas(ls => ls.map(l => ({ ...l, _modificado: false, _novo: false })));

      // Recarrega para obter os IDs dos novos produtos
      const { data: atualizados } = await api.get('/produtos/admin');
      setLinhas(atualizados.map(p => ({
        _key:                    p.id,
        id:                      p.id,
        nome:                    p.nome || '',
        preco:                   p.preco || '',
        categoria_id:            p.categoria_id || '',
        unidade_comercial:       p.unidade_comercial || 'UN',
        codigo_ncm:              p.codigo_ncm || '',
        cfop:                    p.cfop || '5102',
        icms_origem:             p.icms_origem || '0',
        icms_situacao_tributaria:p.icms_situacao_tributaria || '102',
        codigo_produto:          p.codigo_produto || '',
        cest:                    p.cest || '',
        ativo:                   p.ativo,
        ordem:                   p.ordem ?? 0,
        _modificado:             false,
        _novo:                   false,
      })));
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  const nModificados = linhas.filter(l => l._modificado).length;

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Produtos em massa</h1>
          <p className={styles.subtitle}>
            {linhas.length} produto(s) · edite diretamente nas células
            {nModificados > 0 && <span className={styles.badge}>{nModificados} alterado(s)</span>}
          </p>
        </div>
        <div className={styles.headerAcoes}>
          <Button variant="ghost" onClick={() => navigate('/painel/produtos')}>
            ← Voltar
          </Button>
          <Button
            variant="secondary"
            onClick={() => setFiscalExpandido(v => !v)}
          >
            {fiscalExpandido ? 'Ocultar' : 'Mostrar'} campos fiscais
          </Button>
          <Button onClick={adicionarLinha}>+ Novo produto</Button>
          <Button
            loading={salvando}
            disabled={nModificados === 0}
            onClick={salvar}
          >
            {nModificados > 0 ? `Salvar ${nModificados} alteração(ões)` : 'Sem alterações'}
          </Button>
        </div>
      </div>

      {erro     && <Alert type="error">{erro}</Alert>}
      {resultado && (
        <Alert type="success">
          ✅ {resultado.inseridos} inserido(s), {resultado.atualizados} atualizado(s)
          {resultado.erros?.length > 0 && (
            <span className={styles.errosInline}> · {resultado.erros.length} erro(s): {resultado.erros.map(e => `linha ${e.linha} (${e.nome})`).join(', ')}</span>
          )}
        </Alert>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thStatus}></th>
              <th className={styles.thNome}>Nome *</th>
              <th className={styles.thPreco}>Preço *</th>
              <th className={styles.thCat}>Categoria</th>
              <th className={styles.thUnd}>Und.</th>
              {fiscalExpandido && <>
                <th className={styles.thFiscal}>Cód. produto</th>
                <th className={styles.thFiscal}>NCM</th>
                <th className={styles.thFiscal}>CFOP</th>
                <th className={styles.thFiscal}>CST/CSOSN</th>
                <th className={styles.thFiscal}>Origem</th>
                <th className={styles.thFiscal}>CEST</th>
              </>}
              <th className={styles.thAtivo}>Ativo</th>
              <th className={styles.thOrdem}>Ordem</th>
              <th className={styles.thAcoes}></th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(l => (
              <tr
                key={l._key}
                className={`${styles.tr} ${l._modificado ? styles.trModificado : ''} ${l._novo ? styles.trNovo : ''}`}
              >
                {/* Indicador de estado */}
                <td className={styles.tdStatus}>
                  {l._novo
                    ? <span className={styles.dotNovo} title="Novo">●</span>
                    : l._modificado
                      ? <span className={styles.dotMod} title="Modificado">●</span>
                      : <span className={styles.dotOk} title="Salvo">●</span>
                  }
                </td>

                {/* Nome */}
                <td className={styles.tdNome}>
                  <input
                    className={`${styles.cell} ${!l.nome.trim() ? styles.cellErro : ''}`}
                    value={l.nome}
                    onChange={e => atualizar(l._key, 'nome', e.target.value)}
                    placeholder="Nome do produto"
                  />
                </td>

                {/* Preço */}
                <td className={styles.tdPreco}>
                  <input
                    className={`${styles.cell} ${styles.cellNum} ${!l.preco || isNaN(parseFloat(l.preco)) ? styles.cellErro : ''}`}
                    type="number" step="0.01" min="0.01"
                    value={l.preco}
                    onChange={e => atualizar(l._key, 'preco', e.target.value)}
                    placeholder="0,00"
                  />
                </td>

                {/* Categoria */}
                <td className={styles.tdCat}>
                  <select
                    className={`${styles.cell} ${styles.cellSel}`}
                    value={l.categoria_id}
                    onChange={e => atualizar(l._key, 'categoria_id', e.target.value)}
                  >
                    <option value="">—</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
                    ))}
                  </select>
                </td>

                {/* Unidade */}
                <td className={styles.tdUnd}>
                  <input
                    className={`${styles.cell} ${styles.cellUnd}`}
                    value={l.unidade_comercial}
                    onChange={e => atualizar(l._key, 'unidade_comercial', e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="UN"
                  />
                </td>

                {/* Campos fiscais (opcionais, expansíveis) */}
                {fiscalExpandido && <>
                  <td>
                    <input
                      className={`${styles.cell} ${styles.cellFiscal}`}
                      value={l.codigo_produto}
                      onChange={e => atualizar(l._key, 'codigo_produto', e.target.value)}
                      placeholder="001"
                    />
                  </td>
                  <td>
                    <input
                      className={`${styles.cell} ${styles.cellFiscal} ${l.codigo_ncm && l.codigo_ncm.length !== 8 ? styles.cellErro : ''}`}
                      value={l.codigo_ncm}
                      onChange={e => atualizar(l._key, 'codigo_ncm', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="00000000"
                      maxLength={8}
                    />
                  </td>
                  <td>
                    <select
                      className={`${styles.cell} ${styles.cellSel}`}
                      value={l.cfop}
                      onChange={e => atualizar(l._key, 'cfop', e.target.value)}
                    >
                      {CFOP_OPCOES.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`${styles.cell} ${styles.cellSel}`}
                      value={l.icms_situacao_tributaria}
                      onChange={e => atualizar(l._key, 'icms_situacao_tributaria', e.target.value)}
                    >
                      {CST_OPCOES.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className={`${styles.cell} ${styles.cellSel}`}
                      value={l.icms_origem}
                      onChange={e => atualizar(l._key, 'icms_origem', e.target.value)}
                    >
                      {ORIGEM_OPCOES.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      className={`${styles.cell} ${styles.cellFiscal}`}
                      value={l.cest}
                      onChange={e => atualizar(l._key, 'cest', e.target.value.replace(/\D/g, '').slice(0, 7))}
                      placeholder="0000000"
                      maxLength={7}
                    />
                  </td>
                </>}

                {/* Ativo */}
                <td className={styles.tdAtivo}>
                  <button
                    className={`${styles.toggleAtivo} ${l.ativo ? styles.toggleAtivo_on : styles.toggleAtivo_off}`}
                    onClick={() => atualizar(l._key, 'ativo', !l.ativo)}
                    title={l.ativo ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar'}
                  >
                    {l.ativo ? '✅' : '⬜'}
                  </button>
                </td>

                {/* Ordem */}
                <td className={styles.tdOrdem}>
                  <input
                    className={`${styles.cell} ${styles.cellNum}`}
                    type="number" min="0"
                    value={l.ordem}
                    onChange={e => atualizar(l._key, 'ordem', e.target.value)}
                  />
                </td>

                {/* Remover linha nova */}
                <td className={styles.tdAcoes}>
                  {l._novo && (
                    <button
                      className={styles.btnRemover}
                      onClick={() => removerLinha(l._key)}
                      title="Remover linha"
                    >✕</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé */}
      <div className={styles.footer}>
        <Button variant="ghost" onClick={adicionarLinha}>+ Novo produto</Button>
        <Button
          loading={salvando}
          disabled={nModificados === 0}
          onClick={salvar}
        >
          {nModificados > 0 ? `Salvar ${nModificados} alteração(ões)` : 'Sem alterações'}
        </Button>
      </div>

      <div className={styles.legenda}>
        <span><span className={styles.dotNovo}>●</span> Novo</span>
        <span><span className={styles.dotMod}>●</span> Modificado</span>
        <span><span className={styles.dotOk}>●</span> Salvo</span>
        <span className={styles.legendaHint}>Apenas linhas modificadas são enviadas ao salvar.</span>
      </div>
    </div>
  );
}

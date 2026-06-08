// src/components/GerenciarEnderecos.jsx
import { useState, useEffect } from 'react';
import { getEnderecos, criarEndereco, editarEndereco, deletarEndereco, tornarPrincipal, buscarCep } from '../services/api';
import { Button, Input, Alert, Modal, Badge } from './ui';
import styles from './GerenciarEnderecos.module.css';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const formVazio = { apelido: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: 'SP', principal: false };

export default function GerenciarEnderecos({ clienteId, modoSelecao, enderecoSelecionado, onSelecionar }) {
  const [enderecos, setEnderecos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [sel, setSel]               = useState(null); // editando
  const [form, setForm]             = useState(formVazio);
  const [salvando, setSalvando]     = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro]             = useState('');
  const [sucesso, setSucesso]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function carregar() {
    try {
      const { data } = await getEnderecos(clienteId);
      setEnderecos(data);
    } catch { setErro('Erro ao carregar endereços'); }
    finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [clienteId]);

  async function handleCepBlur() {
    const cep = form.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    const dados = await buscarCep(cep);
    if (dados) {
      setForm(f => ({
        ...f,
        endereco: dados.logradouro || f.endereco,
        bairro:   dados.bairro     || f.bairro,
        cidade:   dados.localidade || f.cidade,
        estado:   dados.uf         || f.estado,
      }));
    }
    setBuscandoCep(false);
  }

  function abrirNovo() {
    setSel(null);
    setForm({ ...formVazio, principal: enderecos.length === 0 });
    setErro(''); setModal(true);
  }

  function abrirEditar(end) {
    setSel(end);
    setForm({
      apelido:     end.apelido,
      cep:         end.cep,
      endereco:    end.endereco,
      numero:      end.numero,
      complemento: end.complemento || '',
      bairro:      end.bairro,
      cidade:      end.cidade,
      estado:      end.estado,
      principal:   end.principal,
    });
    setErro(''); setModal(true);
  }

  async function salvar(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const dados = { ...form, cep: form.cep.replace(/\D/g, '') };
      if (clienteId) dados.cliente_id = clienteId;

      if (sel) await editarEndereco(sel.id, dados);
      else     await criarEndereco(dados);

      setSucesso(sel ? 'Endereço atualizado!' : 'Endereço adicionado!');
      setModal(false);
      await carregar();
      setTimeout(() => setSucesso(''), 3000);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function handleDeletar(id) {
    if (!confirm('Remover este endereço?')) return;
    try {
      await deletarEndereco(id);
      await carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao remover');
    }
  }

  async function handlePrincipal(id) {
    try { await tornarPrincipal(id); await carregar(); }
    catch { setErro('Erro ao definir endereço principal'); }
  }

  if (loading) return <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Carregando endereços...</p>;

  return (
    <div className={styles.wrap}>
      {sucesso && <Alert type="success">{sucesso}</Alert>}
      {erro    && <Alert type="error">{erro}</Alert>}

      <div className={styles.lista}>
        {enderecos.map(end => {
          const selecionado = enderecoSelecionado === end.id;
          return (
            <div key={end.id}
              className={`${styles.card} ${selecionado ? styles.cardSelecionado : ''} ${modoSelecao ? styles.cardClicavel : ''}`}
              onClick={() => modoSelecao && onSelecionar?.(end)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardLeft}>
                  <span className={styles.apelido}>{end.apelido}</span>
                  {end.principal && <Badge color="green">Principal</Badge>}
                  {selecionado   && <Badge color="blue">Selecionado</Badge>}
                </div>
                {!modoSelecao && (
                  <div className={styles.cardActions}>
                    {!end.principal && (
                      <button className={styles.btnLink} onClick={() => handlePrincipal(end.id)}>
                        Tornar principal
                      </button>
                    )}
                    <button className={styles.btnLink} onClick={() => abrirEditar(end)}>Editar</button>
                    {!end.principal && (
                      <button className={`${styles.btnLink} ${styles.btnDanger}`} onClick={() => handleDeletar(end.id)}>
                        Remover
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className={styles.endLine}>{end.endereco}, {end.numero}{end.complemento ? ` ${end.complemento}` : ''}</p>
              <p className={styles.endLine}>{end.bairro} — {end.cidade}/{end.estado} · CEP {end.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</p>
              {end.zona_nome && (
                <p className={styles.zona}>
                  📍 {end.zona_nome} · frete R$ {parseFloat(end.custo_entrega).toFixed(2)} · {end.prazo_dias} dia(s) útil(eis)
                </p>
              )}
            </div>
          );
        })}
      </div>

      {enderecos.length < 3 && !modoSelecao && (
        <Button variant="ghost" size="sm" onClick={abrirNovo}>+ Adicionar endereço</Button>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={sel ? 'Editar endereço' : 'Novo endereço'}>
        <form onSubmit={salvar} className={styles.form}>
          <Input label="Apelido (ex: Casa, Trabalho)" value={form.apelido}
            onChange={e => set('apelido', e.target.value)} required placeholder="Casa" />

          <div className={styles.cepRow}>
            <Input label="CEP" value={form.cep}
              onChange={e => set('cep', e.target.value)}
              onBlur={handleCepBlur}
              required placeholder="13480-100" maxLength={9} />
            {buscandoCep && <span className={styles.buscando}>Buscando...</span>}
          </div>

          <div className={styles.row2}>
            <Input label="Endereço" value={form.endereco}
              onChange={e => set('endereco', e.target.value)} required />
            <Input label="Número" value={form.numero}
              onChange={e => set('numero', e.target.value)} required />
          </div>
          <div className={styles.row2}>
            <Input label="Complemento" value={form.complemento}
              onChange={e => set('complemento', e.target.value)} />
            <Input label="Bairro" value={form.bairro}
              onChange={e => set('bairro', e.target.value)} required />
          </div>
          <div className={styles.row2}>
            <Input label="Cidade" value={form.cidade}
              onChange={e => set('cidade', e.target.value)} required />
            <div className={styles.field}>
              <label className={styles.label}>Estado</label>
              <select className={styles.select} value={form.estado}
                onChange={e => set('estado', e.target.value)}>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <label className={styles.checkLabel}>
            <input type="checkbox" checked={form.principal}
              onChange={e => set('principal', e.target.checked)} />
            Definir como endereço principal
          </label>

          {erro && <Alert type="error">{erro}</Alert>}

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(false)}>Cancelar</Button>
            <Button type="submit" loading={salvando}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

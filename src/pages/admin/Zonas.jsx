// src/pages/admin/Zonas.jsx
import { useState, useEffect, useRef } from 'react';
import { getZonas, criarZona, editarZona } from '../../services/api';
import api from '../../services/api';
import { Card, Button, Input, Alert, Spinner, Modal, Badge } from '../../components/ui';
import styles from './Zonas.module.css';

const CORES_PADRAO = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
];

const formVazio = {
  nome: '', cep_inicio: '', cep_fim: '',
  custo_entrega: '', prazo_dias: '1', cor: '#3b82f6',
};

export default function Zonas() {
  const [zonas, setZonas]             = useState([]);
  const [loadingZonas, setLoadingZonas] = useState(true);  // carregamento das zonas
  const [mapaReady, setMapaReady]     = useState(false);   // mapa inicializado
  const [erro, setErro]               = useState('');
  const [sucesso, setSucesso]         = useState('');
  const [modal, setModal]             = useState(null);
  const [sel, setSel]                 = useState(null);
  const [form, setForm]               = useState(formVazio);
  const [salvando, setSalvando]       = useState(false);
  const [zonaDesenho, setZonaDesenho] = useState(null);
  const [modoDesenho, setModoDesenho] = useState(false);
  const [pontosCount, setPontosCount] = useState(0);

  const mapRef           = useRef(null);
  const leafletRef       = useRef(null);
  const camadasRef       = useRef({});
  const pontosTmpRef     = useRef([]);
  const marcadoresTmpRef = useRef([]);
  const linhaTmpRef      = useRef(null);

  // ── Inicializa mapa após o DOM estar pronto ───────────────────────────────────
  // Não usa `if (loading) return <Spinner />` antes do render do mapa —
  // o container precisa existir no DOM antes de L.map() ser chamado.
  useEffect(() => {
    let cancelado = false;

    async function inicializar() {
      // 1. CSS
      if (!document.querySelector('link[href*="leaflet.min.css"]')) {
        const link = document.createElement('link');
        link.rel  = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // 2. JS
      if (!window.L) {
        await new Promise((resolve, reject) => {
          if (document.querySelector('script[src*="leaflet.min.js"]')) {
            const poll = setInterval(() => {
              if (window.L) { clearInterval(poll); resolve(); }
            }, 50);
            return;
          }
          const script   = document.createElement('script');
          script.src     = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
          script.onload  = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      if (cancelado) return;

      // 3. Garante que o container está pintado no DOM
      await new Promise(resolve => requestAnimationFrame(() =>
        requestAnimationFrame(resolve) // dois frames para garantir
      ));

      if (cancelado || !mapRef.current || leafletRef.current) return;

      // 4. Inicializa o mapa
      const L   = window.L;
      const map = L.map(mapRef.current, { zoomControl: true })
                   .setView([-22.5, -47.4], 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletRef.current = map;
      setMapaReady(true);

      // 5. Carrega zonas
      if (!cancelado) await carregarZonas(map);
    }

    inicializar().catch(err => {
      console.error('Erro ao inicializar mapa:', err);
      setErro('Erro ao carregar o mapa. Recarregue a página.');
      setLoadingZonas(false);
    });

    return () => {
      cancelado = true;
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  async function carregarZonas(mapInstance) {
    try {
      const { data } = await getZonas();
      setZonas(data);
      renderizarZonas(data, mapInstance || leafletRef.current);
    } catch (err) {
      console.error('Erro ao carregar zonas:', err);
      setErro('Erro ao carregar zonas de entrega.');
    } finally {
      setLoadingZonas(false);
    }
  }

  function renderizarZonas(lista, map) {
    if (!map || !window.L) return;
    const L = window.L;

    Object.values(camadasRef.current).forEach(c => map.removeLayer(c));
    camadasRef.current = {};

    lista.forEach(zona => {
      if (!zona.poligono?.length) return;
      const cor  = zona.cor || '#3b82f6';
      const poly = L.polygon(zona.poligono, {
        color: cor, fillColor: cor, fillOpacity: 0.25, weight: 2,
      }).addTo(map);

      poly.bindTooltip(
        `<strong>${zona.nome}</strong><br>` +
        `R$ ${parseFloat(zona.custo_entrega).toFixed(2)} · ${zona.prazo_dias} dia(s)`,
        { sticky: true }
      );

      camadasRef.current[zona.id] = poly;
    });
  }

  // ── Modo desenho ─────────────────────────────────────────────────────────────
  function iniciarDesenho(zona) {
    const map = leafletRef.current;
    if (!map || !window.L) return;
    const L = window.L;

    setZonaDesenho(zona);
    setModoDesenho(true);
    pontosTmpRef.current = [];
    setPontosCount(0);

    if (camadasRef.current[zona.id]) {
      map.removeLayer(camadasRef.current[zona.id]);
      delete camadasRef.current[zona.id];
    }

    map.getContainer().style.cursor = 'crosshair';

    function aoClicar(e) {
      const { lat, lng } = e.latlng;
      pontosTmpRef.current.push([lat, lng]);
      setPontosCount(c => c + 1);

      const marker = L.circleMarker([lat, lng], {
        radius: 5, color: zona.cor || '#3b82f6', fillOpacity: 1,
      }).addTo(map);
      marcadoresTmpRef.current.push(marker);

      if (linhaTmpRef.current) map.removeLayer(linhaTmpRef.current);
      if (pontosTmpRef.current.length > 1) {
        linhaTmpRef.current = L.polyline(pontosTmpRef.current, {
          color: zona.cor || '#3b82f6', dashArray: '4',
        }).addTo(map);
      }
    }

    map._desenhoClick = aoClicar;
    map.on('click', aoClicar);
  }

  function cancelarDesenho() {
    const map = leafletRef.current;
    if (!map) return;

    map.off('click', map._desenhoClick);
    map.getContainer().style.cursor = '';
    marcadoresTmpRef.current.forEach(m => map.removeLayer(m));
    marcadoresTmpRef.current = [];
    if (linhaTmpRef.current) { map.removeLayer(linhaTmpRef.current); linhaTmpRef.current = null; }
    pontosTmpRef.current = [];
    setPontosCount(0);

    if (zonaDesenho) renderizarZonas(zonas, map);
    setModoDesenho(false);
    setZonaDesenho(null);
  }

  async function confirmarDesenho() {
    const pontos = pontosTmpRef.current;
    if (pontos.length < 3) { setErro('Clique ao menos 3 pontos no mapa.'); return; }

    const map = leafletRef.current;
    map.off('click', map._desenhoClick);
    map.getContainer().style.cursor = '';
    marcadoresTmpRef.current.forEach(m => map.removeLayer(m));
    marcadoresTmpRef.current = [];
    if (linhaTmpRef.current) { map.removeLayer(linhaTmpRef.current); linhaTmpRef.current = null; }

    setSalvando(true);
    try {
      await api.patch(`/admin/zonas/${zonaDesenho.id}/poligono`, { poligono: pontos });
      feedback('Polígono salvo!');
      pontosTmpRef.current = [];
      setPontosCount(0);
      setModoDesenho(false);
      setZonaDesenho(null);
      await carregarZonas();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar polígono');
    } finally { setSalvando(false); }
  }

  async function removerPoligono(zona) {
    if (!confirm(`Remover o polígono de "${zona.nome}"? A zona voltará a usar faixas de CEP.`)) return;
    try {
      await api.delete(`/admin/zonas/${zona.id}/poligono`);
      feedback('Polígono removido.');
      await carregarZonas();
    } catch { setErro('Erro ao remover polígono'); }
  }

  function centralizarZona(zona) {
    const map  = leafletRef.current;
    const poly = camadasRef.current[zona.id];
    if (map && poly) map.fitBounds(poly.getBounds(), { padding: [40, 40] });
  }

  // ── Modal criar / editar ──────────────────────────────────────────────────────
  function abrirCriar() {
    const proxCor = CORES_PADRAO[zonas.length % CORES_PADRAO.length];
    setForm({ ...formVazio, cor: proxCor });
    setSel(null); setErro(''); setModal('criar');
  }

  function abrirEditar(zona) {
    setForm({
      nome: zona.nome, cep_inicio: zona.cep_inicio, cep_fim: zona.cep_fim,
      custo_entrega: zona.custo_entrega, prazo_dias: zona.prazo_dias,
      cor: zona.cor || '#3b82f6',
    });
    setSel(zona); setErro(''); setModal('editar');
  }

  async function salvar(e) {
    e.preventDefault(); setSalvando(true); setErro('');
    try {
      const dados = {
        nome:          form.nome,
        cep_inicio:    form.cep_inicio.replace(/\D/g, ''),
        cep_fim:       form.cep_fim.replace(/\D/g, ''),
        custo_entrega: parseFloat(form.custo_entrega),
        prazo_dias:    parseInt(form.prazo_dias),
        cor:           form.cor,
      };
      if (modal === 'editar' && sel) await editarZona(sel.id, dados);
      else                           await criarZona(dados);
      setModal(null);
      feedback('Zona salva!');
      await carregarZonas();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  function feedback(msg) {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 3000);
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // IMPORTANTE: não usar `if (loading) return <Spinner />` aqui.
  // O div do mapa precisa estar no DOM antes do Leaflet inicializar.
  // O spinner fica sobreposto ao container do mapa.

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Zonas de entrega</h1>
          <p className={styles.subtitle}>
            {loadingZonas
              ? 'Carregando...'
              : `${zonas.length} zona(s) · desenhe polígonos no mapa ou use faixas de CEP como fallback`
            }
          </p>
        </div>
        <Button onClick={abrirCriar} disabled={loadingZonas}>+ Nova zona</Button>
      </div>

      {erro    && <Alert type="error">{erro}</Alert>}
      {sucesso && <Alert type="success">{sucesso}</Alert>}

      {modoDesenho && (
        <div className={styles.bannerDesenho}>
          <span>
            ✏️ Desenhando <strong>{zonaDesenho?.nome}</strong> —
            clique no mapa para adicionar pontos ({pontosCount} ponto(s))
          </span>
          <div className={styles.bannerAcoes}>
            <Button size="sm" onClick={confirmarDesenho} loading={salvando}>
              ✅ Confirmar polígono
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelarDesenho}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className={styles.layout}>
        {/* Container do mapa — SEMPRE renderizado para o Leaflet encontrar o div */}
        <div className={styles.mapaWrap}>
          <div ref={mapRef} className={styles.mapa} />
          {!mapaReady && (
            <div className={styles.mapaOverlay}>
              <Spinner />
            </div>
          )}
        </div>

        {/* Painel lateral */}
        <div className={styles.painel}>
          {loadingZonas ? (
            <div className={styles.painelLoading}><Spinner /></div>
          ) : zonas.length === 0 ? (
            <p className={styles.vazio}>Nenhuma zona cadastrada. Crie uma para começar.</p>
          ) : (
            zonas.map(zona => (
              <Card key={zona.id} className={`${styles.zonaCard} ${zonaDesenho?.id === zona.id ? styles.zonaCardAtiva : ''}`}>
                <div className={styles.zonaHeader}>
                  <div className={styles.zonaNomeWrap}>
                    <span className={styles.zonaCorDot} style={{ background: zona.cor || '#3b82f6' }} />
                    <span className={styles.zonaNome}>{zona.nome}</span>
                    {!zona.ativa && <Badge color="gray">Inativa</Badge>}
                  </div>
                </div>

                <div className={styles.zonaInfo}>
                  <span>R$ {parseFloat(zona.custo_entrega).toFixed(2)}</span>
                  <span>{zona.prazo_dias} dia(s)</span>
                  <span className={styles.zonaCep}>{zona.cep_inicio}–{zona.cep_fim}</span>
                </div>

                <div className={styles.zonaStatus}>
                  {zona.poligono?.length
                    ? <span className={styles.tagPoligono}>🗺️ Polígono ativo ({zona.poligono.length} pts)</span>
                    : <span className={styles.tagCep}>📮 Usando faixa de CEP</span>
                  }
                </div>

                <div className={styles.zonaAcoes}>
                  {zona.poligono?.length
                    ? <Button size="sm" variant="ghost" onClick={() => centralizarZona(zona)}>Ver no mapa</Button>
                    : null
                  }
                  <Button size="sm" variant="secondary"
                    onClick={() => iniciarDesenho(zona)} disabled={modoDesenho || !mapaReady}>
                    {zona.poligono?.length ? 'Redesenhar' : 'Desenhar'}
                  </Button>
                  {zona.poligono?.length
                    ? <Button size="sm" variant="ghost" onClick={() => removerPoligono(zona)}>🗑 Polígono</Button>
                    : null
                  }
                  <Button size="sm" variant="ghost" onClick={() => abrirEditar(zona)}>Editar</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)}
        title={modal === 'editar' ? `Editar — ${sel?.nome}` : 'Nova zona'}>
        <form onSubmit={salvar} className={styles.form}>
          {erro && <Alert type="error">{erro}</Alert>}

          <Input label="Nome da zona" value={form.nome}
            onChange={e => set('nome', e.target.value)} required />

          <div className={styles.row2}>
            <Input label="CEP início" value={form.cep_inicio} maxLength={8}
              onChange={e => set('cep_inicio', e.target.value.replace(/\D/g, ''))}
              placeholder="13480000" required />
            <Input label="CEP fim" value={form.cep_fim} maxLength={8}
              onChange={e => set('cep_fim', e.target.value.replace(/\D/g, ''))}
              placeholder="13489999" required />
          </div>

          <div className={styles.row2}>
            <Input label="Frete (R$)" type="number" step="0.01" min="0"
              value={form.custo_entrega}
              onChange={e => set('custo_entrega', e.target.value)} required />
            <Input label="Prazo (dias)" type="number" min="1"
              value={form.prazo_dias}
              onChange={e => set('prazo_dias', e.target.value)} required />
          </div>

          <div className={styles.corField}>
            <label className={styles.corLabel}>Cor no mapa</label>
            <div className={styles.corWrap}>
              <input type="color" value={form.cor}
                onChange={e => set('cor', e.target.value)}
                className={styles.corInput} />
              <span className={styles.corHex}>{form.cor}</span>
              <div className={styles.coresSugeridas}>
                {CORES_PADRAO.map(c => (
                  <button key={c} type="button"
                    className={`${styles.corBtn} ${form.cor === c ? styles.corBtnSel : ''}`}
                    style={{ background: c }}
                    onClick={() => set('cor', c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Cancelar</Button>
            <Button type="submit" loading={salvando}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

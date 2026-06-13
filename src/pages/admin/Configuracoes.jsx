// src/pages/admin/Configuracoes.jsx
import { useState, useRef, useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';
import api from '../../services/api';
import { Card, Button, Input, Alert } from '../../components/ui';
import styles from './Configuracoes.module.css';

const CLOUD_NAME    = 'ddhyk7nat';
const UPLOAD_PRESET = 'au0f8iuw';

const FONTES = [
  'Inter', 'Poppins', 'Roboto', 'Lato', 'Montserrat',
  'Open Sans', 'Nunito', 'Raleway', 'Playfair Display', 'Merriweather',
];

const ABAS = ['Identidade', 'Visual', 'Contato', 'Integrações'];

export default function Configuracoes() {
  const { config, setConfig } = useConfig();
  const [aba, setAba]           = useState('Identidade');
  const [form, setForm]         = useState({ ...config });
  const [intForm, setIntForm]   = useState({
    mp_access_token: '', mp_webhook_secret: '', mp_ambiente: 'sandbox',
    focusnfe_token: '', focusnfe_ambiente: 'homologacao', cnpj_emitente: '',
    brevo_api_key: '', brevo_sender_name: '', brevo_sender_email: '',
    frontend_url: '', base_url: '',
  });
  const [intInfo, setIntInfo]   = useState({}); // flags do GET
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [sucesso, setSucesso]   = useState('');
  const [erro, setErro]         = useState('');
  const inputLogoRef            = useRef(null);

  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setInt = (k, v) => setIntForm(f => ({ ...f, [k]: v }));

  // Carrega estado atual das integrações
  useEffect(() => {
    api.get('/admin/integracoes')
      .then(r => {
        setIntInfo(r.data);
        // Pré-preenche campos não sensíveis
        setIntForm(f => ({
          ...f,
          mp_ambiente:        r.data.mp_ambiente        || 'sandbox',
          focusnfe_ambiente:  r.data.focusnfe_ambiente  || 'homologacao',
          cnpj_emitente:      r.data.cnpj_emitente      || '',
          brevo_sender_name:  r.data.brevo_sender_name  || '',
          brevo_sender_email: r.data.brevo_sender_email || '',
          frontend_url:       r.data.frontend_url       || '',
          base_url:           r.data.base_url           || '',
        }));
      })
      .catch(() => {});
  }, []);

  async function handleUploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErro('Selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024)    { setErro('Logo deve ter no máximo 2MB'); return; }

    setUploadando(true); setErro('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('folder', 'paparica/config');

      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (data.secure_url) set('logo_url', data.secure_url);
      else setErro('Erro ao fazer upload do logo');
    } catch { setErro('Erro ao fazer upload. Tente novamente.'); }
    finally { setUploadando(false); if (inputLogoRef.current) inputLogoRef.current.value = ''; }
  }

  async function salvarIdentidade(e) {
    e.preventDefault(); setSalvando(true); setErro(''); setSucesso('');
    try {
      const { data } = await api.patch('/admin/configuracoes', form);
      setConfig(data);
      feedback('Configurações salvas!');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function salvarIntegracoes(e) {
    e.preventDefault(); setSalvando(true); setErro(''); setSucesso('');
    try {
      // Só envia campos que o usuário preencheu (não envia string vazia para não limpar token existente)
      const payload = {};
      const campos = [
        'mp_access_token','mp_webhook_secret','mp_ambiente',
        'focusnfe_token','focusnfe_ambiente','cnpj_emitente',
        'brevo_api_key','brevo_sender_name','brevo_sender_email',
        'frontend_url','base_url',
      ];
      campos.forEach(k => {
        // Envia sempre os campos não-sensíveis; para tokens, só envia se preencheu algo novo
        const sensivel = ['mp_access_token','mp_webhook_secret','focusnfe_token','brevo_api_key'].includes(k);
        if (!sensivel || intForm[k]) payload[k] = intForm[k];
        else if (!sensivel) payload[k] = intForm[k];
      });

      await api.patch('/admin/integracoes', payload);

      // Recarrega flags
      const { data } = await api.get('/admin/integracoes');
      setIntInfo(data);
      setIntForm(f => ({
        ...f,
        mp_access_token: '', mp_webhook_secret: '',
        focusnfe_token: '', brevo_api_key: '',
      }));
      feedback('Integrações salvas!');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar integrações');
    } finally { setSalvando(false); }
  }

  function feedback(msg) {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 4000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>Personalize o sistema e gerencie integrações</p>
      </div>

      {sucesso && <Alert type="success">{sucesso}</Alert>}
      {erro    && <Alert type="error">{erro}</Alert>}

      {/* Abas */}
      <div className={styles.abas}>
        {ABAS.map(a => (
          <button key={a}
            className={`${styles.aba} ${aba === a ? styles.abaAtiva : ''}`}
            onClick={() => { setAba(a); setErro(''); setSucesso(''); }}
            type="button"
          >
            {a === 'Identidade'   && '🏪 '}
            {a === 'Visual'       && '🎨 '}
            {a === 'Contato'      && '📬 '}
            {a === 'Integrações'  && '🔌 '}
            {a}
          </button>
        ))}
      </div>

      {/* ── Identidade ── */}
      {aba === 'Identidade' && (
        <form onSubmit={salvarIdentidade} className={styles.form}>
          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>🏪 Identidade do negócio</h3>
            <Input label="Nome do negócio" value={form.nome_negocio}
              onChange={e => set('nome_negocio', e.target.value)} required />
            <div className={styles.logoWrap}>
              <label className={styles.fieldLabel}>Logo</label>
              {form.logo_url ? (
                <div className={styles.logoPreview}>
                  <img src={form.logo_url} alt="Logo" />
                  <button type="button" className={styles.logoRemover}
                    onClick={() => set('logo_url', '')}>✕ Remover</button>
                </div>
              ) : (
                <div className={styles.logoVazio}>Nenhum logo carregado</div>
              )}
              <div className={styles.logoAcoes}>
                <button type="button" className={styles.btnUpload}
                  onClick={() => inputLogoRef.current?.click()} disabled={uploadando}>
                  {uploadando ? '⏳ Enviando...' : '📁 Carregar logo'}
                </button>
                <input ref={inputLogoRef} type="file" accept="image/*"
                  style={{ display: 'none' }} onChange={handleUploadLogo} />
                <span className={styles.hint}>PNG ou SVG transparente recomendado — máx. 2MB</span>
              </div>
            </div>
          </Card>
          <div className={styles.saveBar}>
            <Button type="submit" size="lg" loading={salvando}>Salvar</Button>
          </div>
        </form>
      )}

      {/* ── Visual ── */}
      {aba === 'Visual' && (
        <form onSubmit={salvarIdentidade} className={styles.form}>
          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>🎨 Visual do sistema</h3>
            <div className={styles.row2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Fonte principal</label>
                <select className={styles.select} value={form.fonte_principal}
                  onChange={e => set('fonte_principal', e.target.value)}>
                  {FONTES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <p className={styles.hint}>Aplicada em todo o sistema em tempo real</p>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Cor primária</label>
                <div className={styles.corRow}>
                  <input type="color" className={styles.inputCor}
                    value={form.cor_primaria}
                    onChange={e => set('cor_primaria', e.target.value)} />
                  <input type="text" className={styles.inputCorTexto}
                    value={form.cor_primaria}
                    onChange={e => set('cor_primaria', e.target.value)}
                    placeholder="#1a6b3c" maxLength={7} />
                </div>
                <p className={styles.hint}>Cor dos botões, links e destaques</p>
              </div>
            </div>
            <div className={styles.preview} style={{ fontFamily: `'${form.fonte_principal}', sans-serif` }}>
              <span style={{ color: form.cor_primaria, fontWeight: 600 }}>{form.nome_negocio}</span>
              {form.logo_url && <img src={form.logo_url} alt="preview" className={styles.previewLogo} />}
              <span style={{ fontSize: 13, color: '#666' }}>— Preview da identidade visual</span>
            </div>
          </Card>
          <div className={styles.saveBar}>
            <Button type="submit" size="lg" loading={salvando}>Salvar</Button>
          </div>
        </form>
      )}

      {/* ── Contato ── */}
      {aba === 'Contato' && (
        <form onSubmit={salvarIdentidade} className={styles.form}>
          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>📬 Meios de contato</h3>
            <p className={styles.sectionDesc}>Aparecem no rodapé dos e-mails enviados aos clientes.</p>
            <div className={styles.row2}>
              <Input label="E-mail de contato" type="email" value={form.email_contato || ''}
                onChange={e => set('email_contato', e.target.value)}
                placeholder="contato@paparica.com.br" />
              <Input label="WhatsApp" value={form.whatsapp || ''}
                onChange={e => set('whatsapp', e.target.value)}
                placeholder="(19) 99999-9999" />
            </div>
          </Card>
          <div className={styles.saveBar}>
            <Button type="submit" size="lg" loading={salvando}>Salvar</Button>
          </div>
        </form>
      )}

      {/* ── Integrações ── */}
      {aba === 'Integrações' && (
        <form onSubmit={salvarIntegracoes} className={styles.form}>

          {/* Mercado Pago */}
          <Card className={styles.section}>
            <div className={styles.integHeader}>
              <div>
                <h3 className={styles.sectionTitle}>💳 Mercado Pago</h3>
                <p className={styles.sectionDesc}>Processamento de pagamentos via Checkout Pro.</p>
              </div>
              <span className={intInfo.mp_ativo ? styles.tagAtivo : styles.tagInativo}>
                {intInfo.mp_ativo ? '✅ Configurado' : '⚠️ Não configurado'}
              </span>
            </div>

            <Input
              label={intInfo.mp_ativo ? 'Access Token (deixe em branco para manter o atual)' : 'Access Token *'}
              type="password"
              value={intForm.mp_access_token}
              onChange={e => setInt('mp_access_token', e.target.value)}
              placeholder={intInfo.mp_ativo ? intInfo.mp_access_token : 'APP_USR-...'}
            />
            <Input
              label={intInfo.mp_ativo ? 'Webhook Secret (deixe em branco para manter)' : 'Webhook Secret'}
              type="password"
              value={intForm.mp_webhook_secret}
              onChange={e => setInt('mp_webhook_secret', e.target.value)}
              placeholder={intInfo.mp_ativo ? intInfo.mp_webhook_secret : 'Chave de validação do webhook'}
            />
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Ambiente</label>
              <select className={styles.select} value={intForm.mp_ambiente}
                onChange={e => setInt('mp_ambiente', e.target.value)}>
                <option value="sandbox">Sandbox (testes)</option>
                <option value="producao">Produção</option>
              </select>
            </div>
          </Card>

          {/* Brevo */}
          <Card className={styles.section}>
            <div className={styles.integHeader}>
              <div>
                <h3 className={styles.sectionTitle}>📧 Brevo (e-mail)</h3>
                <p className={styles.sectionDesc}>Envio de e-mails transacionais para os clientes.</p>
              </div>
              <span className={intInfo.brevo_ativo ? styles.tagAtivo : styles.tagInativo}>
                {intInfo.brevo_ativo ? '✅ Configurado' : '⚠️ Não configurado'}
              </span>
            </div>

            <Input
              label={intInfo.brevo_ativo ? 'API Key (deixe em branco para manter)' : 'API Key *'}
              type="password"
              value={intForm.brevo_api_key}
              onChange={e => setInt('brevo_api_key', e.target.value)}
              placeholder={intInfo.brevo_ativo ? intInfo.brevo_api_key : 'xkeysib-...'}
            />
            <div className={styles.row2}>
              <Input label="Nome do remetente" value={intForm.brevo_sender_name}
                onChange={e => setInt('brevo_sender_name', e.target.value)}
                placeholder="Papa Rica" />
              <Input label="E-mail remetente" type="email" value={intForm.brevo_sender_email}
                onChange={e => setInt('brevo_sender_email', e.target.value)}
                placeholder="mkt@paparica.com.br" />
            </div>
          </Card>

          {/* Focus NFe */}
          <Card className={styles.section}>
            <div className={styles.integHeader}>
              <div>
                <h3 className={styles.sectionTitle}>🧾 Focus NFe (NFC-e)</h3>
                <p className={styles.sectionDesc}>Emissão de nota fiscal do consumidor. Opcional — plano Retail R$59,90/mês.</p>
              </div>
              <span className={intInfo.nfce_ativo ? styles.tagAtivo : styles.tagInativo}>
                {intInfo.nfce_ativo ? '✅ Configurado' : '— Não ativado'}
              </span>
            </div>

            <Input
              label={intInfo.nfce_ativo ? 'Token API (deixe em branco para manter)' : 'Token API'}
              type="password"
              value={intForm.focusnfe_token}
              onChange={e => setInt('focusnfe_token', e.target.value)}
              placeholder={intInfo.nfce_ativo ? intInfo.focusnfe_token : 'Token do painel Focus NFe'}
            />
            <div className={styles.row2}>
              <Input label="CNPJ do emitente" value={intForm.cnpj_emitente}
                onChange={e => setInt('cnpj_emitente', e.target.value.replace(/\D/g, ''))}
                placeholder="02682356000188" maxLength={14} />
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Ambiente</label>
                <select className={styles.select} value={intForm.focusnfe_ambiente}
                  onChange={e => setInt('focusnfe_ambiente', e.target.value)}>
                  <option value="homologacao">Homologação (testes)</option>
                  <option value="producao">Produção</option>
                </select>
              </div>
            </div>
          </Card>

          {/* URLs do sistema */}
          <Card className={styles.section}>
            <h3 className={styles.sectionTitle}>🔗 URLs do sistema</h3>
            <p className={styles.sectionDesc}>Usadas nos links dos e-mails e callbacks do Mercado Pago.</p>
            <div className={styles.row2}>
              <Input label="URL do frontend" value={intForm.frontend_url}
                onChange={e => setInt('frontend_url', e.target.value)}
                placeholder="https://assinaturas.paparica.com.br" />
              <Input label="URL do backend (API)" value={intForm.base_url}
                onChange={e => setInt('base_url', e.target.value)}
                placeholder="https://api.paparica.com.br" />
            </div>
          </Card>

          <div className={styles.saveBar}>
            <Button type="submit" size="lg" loading={salvando}>Salvar integrações</Button>
          </div>
        </form>
      )}
    </div>
  );
}
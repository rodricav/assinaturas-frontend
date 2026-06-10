// src/pages/admin/Configuracoes.jsx
import { useState, useRef } from 'react';
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

export default function Configuracoes() {
  const { config, setConfig } = useConfig();
  const [form, setForm]       = useState({ ...config });
  const [salvando, setSalvando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro]       = useState('');
  const inputLogoRef          = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleUploadLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErro('Selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024) { setErro('Logo deve ter no máximo 2MB'); return; }

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

  async function salvar(e) {
    e.preventDefault(); setSalvando(true); setErro(''); setSucesso('');
    try {
      const { data } = await api.patch('/admin/configuracoes', form);
      setConfig(data);
      setSucesso('Configurações salvas com sucesso!');
      setTimeout(() => setSucesso(''), 4000);
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurações</h1>
        <p className={styles.subtitle}>Personalize o sistema e os e-mails enviados aos clientes</p>
      </div>

      {sucesso && <Alert type="success">{sucesso}</Alert>}
      {erro    && <Alert type="error">{erro}</Alert>}

      <form onSubmit={salvar} className={styles.form}>

        {/* Identidade */}
        <Card className={styles.section}>
          <h3 className={styles.sectionTitle}>🏪 Identidade do negócio</h3>

          <Input label="Nome do negócio" value={form.nome_negocio}
            onChange={e => set('nome_negocio', e.target.value)} required />

          {/* Logo */}
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
                onClick={() => inputLogoRef.current?.click()}
                disabled={uploadando}>
                {uploadando ? '⏳ Enviando...' : '📁 Carregar logo'}
              </button>
              <input ref={inputLogoRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleUploadLogo} />
              <span className={styles.hint}>PNG ou SVG transparente recomendado — máx. 2MB</span>
            </div>
          </div>
        </Card>

        {/* Visual */}
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

          {/* Preview */}
          <div className={styles.preview} style={{ fontFamily: `'${form.fonte_principal}', sans-serif` }}>
            <span style={{ color: form.cor_primaria, fontWeight: 600 }}>{form.nome_negocio}</span>
            {form.logo_url && <img src={form.logo_url} alt="preview" className={styles.previewLogo} />}
            <span style={{ fontSize: 13, color: '#666' }}>— Preview da identidade visual</span>
          </div>
        </Card>

        {/* Contato */}
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
          <Button type="submit" size="lg" loading={salvando}>
            Salvar configurações
          </Button>
        </div>
      </form>
    </div>
  );
}

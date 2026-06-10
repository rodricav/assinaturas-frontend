// src/context/ConfigContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ConfigContext = createContext({});

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState({
    nome_negocio:    'AssínaSaas',
    logo_url:        '',
    fonte_principal: 'Inter',
    cor_primaria:    '#1a6b3c',
    email_contato:   '',
    whatsapp:        '',
  });

  useEffect(() => {
    api.get('/admin/configuracoes')
      .then(r => { if (r.data?.nome_negocio) setConfig(r.data); })
      .catch(() => {});
  }, []);

  // Aplica fonte e cor primária dinamicamente
  useEffect(() => {
    if (config.fonte_principal) {
      // Carrega fonte do Google Fonts
      const fontName = config.fonte_principal.replace(/ /g, '+');
      const linkId   = 'dynamic-font';
      let link = document.getElementById(linkId);
      if (!link) {
        link = document.createElement('link');
        link.id   = linkId;
        link.rel  = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;600;700&display=swap`;
      document.documentElement.style.setProperty('--font-sans', `'${config.fonte_principal}', sans-serif`);
    }
    if (config.cor_primaria) {
      document.documentElement.style.setProperty('--brand', config.cor_primaria);
    }
  }, [config.fonte_principal, config.cor_primaria]);

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export const useConfig = () => useContext(ConfigContext);

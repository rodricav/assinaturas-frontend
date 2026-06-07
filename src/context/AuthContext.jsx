// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')); } catch { return null; }
  });

  function entrar(token, dados) {
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(dados));
    setUsuario(dados);
  }

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  }

  const isAdmin   = usuario?.papel === 'admin';
  const isCliente = usuario?.papel === 'cliente';

  return (
    <AuthContext.Provider value={{ usuario, entrar, sair, logado: !!usuario, isAdmin, isCliente }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

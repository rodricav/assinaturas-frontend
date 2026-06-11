// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Injeta token automaticamente
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Redireciona para login se 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const login     = (data) => api.post('/clientes/login', data);
export const cadastrar = (data) => api.post('/clientes', data);
export const getPerfil = ()     => api.get('/clientes/me');

// ── Produtos ────────────────────────────────────────────────────────────────
export const getProdutos          = ()         => api.get('/produtos');
export const getProdutosAdmin     = ()         => api.get('/produtos/admin');
export const criarProduto         = (data)     => api.post('/produtos', data);
export const editarProduto        = (id, data) => api.patch(`/produtos/${id}`, data);
export const ajustarEstoque       = (id, data) => api.patch(`/produtos/${id}/estoque`, data);
export const getPedidosPorProduto = (id)       => api.get(`/admin/produtos/${id}/pedidos`);

// ── Planos ──────────────────────────────────────────────────────────────────
export const getPlanos = () => api.get('/admin/planos').catch(() =>
  // fallback: busca do banco via admin
  api.get('/admin/dashboard').then(() => ({ data: [] }))
);

// ── Assinaturas ─────────────────────────────────────────────────────────────
export const getMinhasAssinaturas = ()         => api.get('/assinaturas/minhas');
export const criarAssinatura      = (data)     => api.post('/assinaturas', data);
export const pausarAssinatura     = (id)       => api.patch(`/assinaturas/${id}/pausar`);
export const reativarAssinatura   = (id)       => api.patch(`/assinaturas/${id}/reativar`);
export const cancelarAssinatura   = (id, data) => api.patch(`/assinaturas/${id}/cancelar`, data);

// ── Pedidos ─────────────────────────────────────────────────────────────────
export const getPedidos      = (params)   => api.get('/pedidos', { params });
export const avancarEstagio  = (id, data) => api.patch(`/pedidos/${id}/estagio`, data);

// ── Admin ────────────────────────────────────────────────────────────────────
export const getDashboard        = ()         => api.get('/admin/dashboard');
export const getZonas            = ()         => api.get('/admin/zonas');
export const criarZona           = (data)     => api.post('/admin/zonas', data);
export const editarZona          = (id, data) => api.patch(`/admin/zonas/${id}`, data);
export const getAssinantes       = ()         => api.get('/admin/assinantes');
export const getAssinaturasAdmin = (params)   => api.get('/admin/assinaturas', { params });
export const rodarScheduler      = ()         => api.post('/admin/dev/rodar-scheduler');

export default api;

// ── Auth Admin ───────────────────────────────────────────────────────────────
export const loginAdmin  = (data) => api.post('/auth/admin/login', data);
export const criarAdmin  = (data) => api.post('/auth/admin/criar', data);
export const getMeAdmin  = ()     => api.get('/auth/admin/me');

// ── Categorias ───────────────────────────────────────────────────────────────
export const getCategorias    = ()         => api.get('/categorias');
export const criarCategoria   = (data)     => api.post('/categorias', data);
export const editarCategoria  = (id, data) => api.patch(`/categorias/${id}`, data);

// ── Endereços ────────────────────────────────────────────────────────────────
export const getEnderecos    = (clienteId) => api.get('/enderecos', { params: clienteId ? { cliente_id: clienteId } : {} });
export const criarEndereco   = (data)      => api.post('/enderecos', data);
export const editarEndereco  = (id, data)  => api.patch(`/enderecos/${id}`, data);
export const deletarEndereco = (id)        => api.delete(`/enderecos/${id}`);
export const tornarPrincipal = (id)        => api.patch(`/enderecos/${id}/principal`);

// ── ViaCEP ───────────────────────────────────────────────────────────────────
export const buscarCep = async (cep) => {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await r.json();
    if (data.erro) return null;
    return data;
  } catch { return null; }
};

// ── Avaliações ────────────────────────────────────────────────────────────────
export const criarAvaliacao     = (data)      => api.post('/avaliacoes', data);
export const getMinhaAvaliacao  = (pedidoId)  => api.get(`/avaliacoes/minha/${pedidoId}`);
export const getAvaliacoesAdmin = ()          => api.get('/avaliacoes/admin');

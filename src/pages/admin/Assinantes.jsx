// src/pages/admin/Assinantes.jsx
import { useState, useEffect } from 'react';
import { getAssinantes } from '../../services/api';
import { Card, Badge, Spinner, Alert } from '../../components/ui';
import styles from './Assinantes.module.css';

export default function Assinantes() {
  const [assinantes, setAssinantes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [erro, setErro]             = useState('');
  const [busca, setBusca]           = useState('');

  useEffect(() => {
    getAssinantes().then(r => setAssinantes(r.data)).catch(() => setErro('Erro ao carregar')).finally(() => setLoading(false));
  }, []);

  const filtrados = assinantes.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase()) ||
    a.email.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assinantes</h1>
          <p className={styles.subtitle}>{assinantes.length} cliente(s) cadastrado(s)</p>
        </div>
        <input
          className={styles.busca} placeholder="Buscar por nome ou e-mail..."
          value={busca} onChange={e => setBusca(e.target.value)}
        />
      </div>

      {erro && <Alert type="error">{erro}</Alert>}

      <div className={styles.tabela}>
        <div className={styles.thead}>
          <span>Cliente</span>
          <span>Contato</span>
          <span>Assinaturas ativas</span>
          <span>Próxima entrega</span>
        </div>
        {filtrados.map(a => (
          <Card key={a.id} className={styles.row}>
            <div className={styles.cliente}>
              <div className={styles.avatar}>{a.nome[0].toUpperCase()}</div>
              <div>
                <div className={styles.nome}>{a.nome}</div>
                <div className={styles.cidade}>{a.cidade}, {a.estado}</div>
              </div>
            </div>
            <div className={styles.contato}>
              <div className={styles.email}>{a.email}</div>
              <div className={styles.tel}>{a.telefone}</div>
            </div>
            <div>
              {parseInt(a.assinaturas_ativas) > 0
                ? <Badge color="green">{a.assinaturas_ativas} ativa(s)</Badge>
                : <Badge color="gray">Nenhuma</Badge>
              }
            </div>
            <div className={styles.proxima}>
              {a.proxima_geracao
                ? new Date(a.proxima_geracao).toLocaleDateString('pt-BR')
                : '—'}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

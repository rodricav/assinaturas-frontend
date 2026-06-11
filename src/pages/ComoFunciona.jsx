// src/pages/ComoFunciona.jsx
import { useNavigate } from 'react-router-dom';
import styles from './ComoFunciona.module.css';

const PASSOS = [
  {
    num: '01',
    icon: '🛒',
    titulo: 'Escolha seus produtos',
    desc: 'Navegue pelo catálogo e adicione os produtos que quiser. Você monta sua própria cesta — sem produtos impostos.',
  },
  {
    num: '02',
    icon: '📅',
    titulo: 'Defina a frequência',
    desc: 'Quinzenal (a cada 15 dias) ou mensal (a cada 30 dias). O plano mensal tem 5% de desconto automático.',
  },
  {
    num: '03',
    icon: '💳',
    titulo: 'Confirme e pague',
    desc: 'No dia programado, geramos seu pedido automaticamente. Você recebe um e-mail com o link de pagamento e tem 2 dias para pagar.',
  },
  {
    num: '04',
    icon: '🚗',
    titulo: 'Receba em casa',
    desc: 'Após o pagamento confirmado, separamos e entregamos no endereço escolhido dentro do prazo da sua região.',
  },
];

const FAQS = [
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim, sem multa e sem fidelidade. Cancele a qualquer momento pelo portal.',
  },
  {
    q: 'E se eu quiser pular uma entrega?',
    a: 'Você pode pausar a assinatura ou alterar os itens com até 3 dias de antecedência da próxima geração.',
  },
  {
    q: 'O que acontece se um item estiver em falta?',
    a: 'Você é avisado por e-mail. O pedido é gerado com os itens disponíveis e o valor ajustado automaticamente.',
  },
  {
    q: 'Posso ter mais de um endereço de entrega?',
    a: 'Sim. Você pode cadastrar até 3 endereços e escolher qual usar em cada assinatura.',
  },
  {
    q: 'Posso fazer um pedido único sem assinar?',
    a: 'Sim! Na aba "Meus Pedidos" tem a opção de fazer um pedido avulso — entrega única, sem assinatura.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: 'Usamos o Mercado Pago. Você pode pagar com cartão de crédito, débito, Pix ou boleto.',
  },
];

export default function ComoFunciona() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.heroTitulo}>Como funciona</h1>
        <p className={styles.heroDesc}>
          Receba produtos frescos da Papa Rica na sua porta, na frequência que preferir.
          Simples, flexível e sem compromisso de longo prazo.
        </p>
        <button className={styles.btnComecar} onClick={() => navigate('/catalogo')}>
          Começar agora →
        </button>
      </div>

      {/* Passos */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitulo}>Em 4 passos simples</h2>
        <div className={styles.passos}>
          {PASSOS.map((p, i) => (
            <div key={i} className={styles.passo}>
              <div className={styles.passoNum}>{p.num}</div>
              <div className={styles.passoIcon}>{p.icon}</div>
              <h3 className={styles.passoTitulo}>{p.titulo}</h3>
              <p className={styles.passoDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefícios */}
      <section className={`${styles.section} ${styles.beneficios}`}>
        <h2 className={styles.sectionTitulo}>Por que assinar?</h2>
        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.cardIcon}>💰</span>
            <h3>Desconto no plano mensal</h3>
            <p>5% off automático ao escolher a frequência mensal.</p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>🔄</span>
            <h3>Flexibilidade total</h3>
            <p>Altere os itens, pause ou cancele quando quiser.</p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>📦</span>
            <h3>Sem surpresas</h3>
            <p>Você aprova o pedido antes de pagar. Nada é cobrado automaticamente.</p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardIcon}>🌿</span>
            <h3>Produtos frescos</h3>
            <p>Direto da Papa Rica para sua mesa, com a qualidade que você já conhece.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitulo}>Perguntas frequentes</h2>
        <div className={styles.faqs}>
          {FAQS.map((f, i) => (
            <div key={i} className={styles.faq}>
              <h3 className={styles.faqQ}>{f.q}</h3>
              <p className={styles.faqA}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.cta}>
        <h2>Pronto para começar?</h2>
        <p>Escolha seus produtos favoritos e configure sua primeira entrega.</p>
        <button className={styles.btnComecar} onClick={() => navigate('/catalogo')}>
          Ver catálogo →
        </button>
      </div>
    </div>
  );
}
// src/services/notificacaoService.js
const axios = require('axios');
const db    = require('../../config/database');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const HEADERS   = {
  'api-key':      process.env.BREVO_API_KEY,
  'Content-Type': 'application/json',
};

const REMETENTE = {
  name:  process.env.BREVO_SENDER_NAME  || 'AssínaSaas',
  email: process.env.BREVO_SENDER_EMAIL || 'noreply@paparica.com.br',
};

// Layout base reutilizável
function layout(conteudo, config = {}) {
  const nome    = config.nome_negocio || process.env.BREVO_SENDER_NAME || 'AssínaSaas';
  const cor     = config.cor_primaria || '#1a6b3c';
  const logo    = config.logo_url;
  const email   = config.email_contato || process.env.BREVO_SENDER_EMAIL || '';
  const whatsapp = config.whatsapp || '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f5f5f0; font-family: Arial, sans-serif; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; }
  .header { background:${cor}; padding:24px 32px; text-align:center; }
  .header img { height:48px; object-fit:contain; }
  .header-nome { color:#fff; font-size:22px; font-weight:700; letter-spacing:0.5px; }
  .body { padding:32px; color:#333; line-height:1.6; }
  .footer { background:#f5f5f0; padding:20px 32px; text-align:center; font-size:12px; color:#888; border-top:1px solid #e8e8e0; }
  .btn { display:inline-block; background:${cor}; color:#fff !important; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:700; font-size:15px; margin:16px 0; }
  .box { background:#f0f7f3; border-left:4px solid ${cor}; border-radius:0 8px 8px 0; padding:16px 20px; margin:16px 0; }
  .box-warn { background:#fff8e6; border-left:4px solid #f59e0b; }
  .itens { background:#f9f9f6; border-radius:8px; padding:16px; margin:16px 0; }
  .item-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; font-size:14px; }
  .item-row:last-child { border-bottom:none; }
  .total-row { display:flex; justify-content:space-between; padding:10px 0 0; font-weight:700; font-size:15px; }
  .stars { font-size:28px; margin:8px 0; }
  h2 { color:${cor}; margin-top:0; }
</style></head>
<body><div style="padding:24px 0;">
  <div class="container">
    <div class="header">
      ${logo ? `<img src="${logo}" alt="${nome}" />` : `<div class="header-nome">${nome}</div>`}
    </div>
    <div class="body">${conteudo}</div>
    <div class="footer">
      <strong>${nome}</strong><br>
      ${email ? `📧 <a href="mailto:${email}" style="color:#888">${email}</a>` : ''}
      ${whatsapp ? ` &nbsp;·&nbsp; 📱 ${whatsapp}` : ''}
      <br><br>
      <small>Você está recebendo este e-mail porque tem uma assinatura ativa.</small>
    </div>
  </div>
</div></body></html>`;
}

const TEMPLATES = {

  assinatura_confirmada: (d, c) => ({
    subject: `✅ Assinatura confirmada — bem-vindo(a), ${d.clienteNome}!`,
    html: layout(`
      <h2>Bem-vindo(a), ${d.clienteNome}! 🎉</h2>
      <p>Sua assinatura <strong>${d.planoNome}</strong> foi confirmada com sucesso.</p>
      <div class="box">
        <p style="margin:0">📅 <strong>Primeira entrega prevista:</strong><br>
        <span style="font-size:18px;font-weight:700">${d.proximaEntrega}</span></p>
      </div>
      <p>Você pode acompanhar suas entregas e gerenciar sua assinatura pelo portal:</p>
      <a href="${process.env.FRONTEND_URL}/assinaturas" class="btn">Acessar minha assinatura</a>
      <p style="font-size:13px;color:#666">Dúvidas? Responda este e-mail que te ajudamos.</p>
    `, c),
  }),

  pedido_gerado: (d, c) => ({
    subject: `💳 Ação necessária: pague o pedido ${d.numeroPedido} até ${d.prazoLimitePagamento || '2 dias antes da entrega'}`,
    html: layout(`
      <h2>Seu pedido foi gerado! 📦</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! Seu pedido <strong>${d.numeroPedido}</strong> está pronto para pagamento.</p>

      ${d.dataEntrega ? `
      <div class="box" style="display:flex;gap:32px;flex-wrap:wrap">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#666;margin-bottom:4px">Estimativa de entrega</div>
          <div style="font-size:18px;font-weight:700;text-transform:capitalize">${d.dataEntrega}</div>
        </div>
        ${d.prazoLimitePagamento ? `
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#666;margin-bottom:4px">Pague até</div>
          <div style="font-size:18px;font-weight:700;color:#c0392b">${d.prazoLimitePagamento}</div>
        </div>` : ''}
      </div>` : ''}

      ${d.itens?.length ? `
      <div class="itens">
        ${d.itens.map(i => `
          <div class="item-row">
            <span>${i.quantidade}× ${i.nome}</span>
          </div>`).join('')}
        <div class="total-row">
          <span>Total</span>
          <span>R$ ${Number(d.total).toFixed(2)}</span>
        </div>
      </div>` : `
      <div class="box">
        <p style="margin:0">💰 <strong>Total:</strong> R$ ${Number(d.total).toFixed(2)}</p>
      </div>`}

      ${d.itensEmFalta?.length ? `
      <div class="box box-warn">
        <p style="margin:0">⚠️ <strong>Itens indisponíveis:</strong> ${d.itensEmFalta.join(', ')}</p>
      </div>` : ''}

      <a href="${d.linkPagamento}" class="btn">💳 Pagar agora</a>

      <div style="background:#fff0f0;border-left:4px solid #c0392b;border-radius:0 8px 8px 0;padding:14px 18px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#c0392b">
          <strong>⚠️ Atenção:</strong> Se o pagamento não for confirmado até
          <strong>${d.prazoLimitePagamento || '2 dias antes da entrega'}</strong>,
          o pedido será automaticamente suspenso e sua entrega não será realizada.
        </p>
      </div>
    `, c),
  }),

  pagamento_confirmado: (d, c) => ({
    subject: `🎉 Pagamento confirmado — Pedido ${d.numeroPedido}`,
    html: layout(`
      <h2>Pagamento confirmado! 🎉</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! Recebemos seu pagamento do pedido <strong>${d.numeroPedido}</strong>.</p>
      <div class="box">
        <p style="margin:0">✅ Seu pedido entrou na fila de separação e em breve será enviado.</p>
      </div>
      ${d.dataEntregaPrevista ? `<p>📅 <strong>Previsão de entrega:</strong> ${d.dataEntregaPrevista}</p>` : ''}
      ${d.nfePdfUrl ? `<a href="${d.nfePdfUrl}" style="display:inline-block;background:#f0f7f3;color:#1a6b3c;padding:10px 20px;border-radius:8px;text-decoration:none;border:1px solid #c5e0d0;margin:8px 0">📄 Baixar Nota Fiscal</a>` : ''}
      <a href="${process.env.FRONTEND_URL}/pedidos" class="btn">Acompanhar pedido</a>
    `, c),
  }),

  em_separacao: (d, c) => ({
    subject: `📦 Pedido ${d.numeroPedido} em separação`,
    html: layout(`
      <h2>Seu pedido está sendo separado! 📦</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! O pedido <strong>${d.numeroPedido}</strong> está sendo preparado com carinho.</p>
      <div class="box">
        <p style="margin:0">🔜 Em breve sai para entrega!</p>
      </div>
      <a href="${process.env.FRONTEND_URL}/pedidos" class="btn">Acompanhar pedido</a>
    `, c),
  }),

  saiu_para_entrega: (d, c) => ({
    subject: `🚗 Pedido ${d.numeroPedido} saiu para entrega!`,
    html: layout(`
      <h2>Seu pedido saiu para entrega! 🚗</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! O pedido <strong>${d.numeroPedido}</strong> está a caminho.</p>
      ${d.dataEntregaPrevista ? `
      <div class="box">
        <p style="margin:0">📅 <strong>Previsão de entrega:</strong><br>
        <span style="font-size:18px;font-weight:700">${d.dataEntregaPrevista}</span></p>
      </div>` : ''}
      <p>Fique de olho! 😊</p>
    `, c),
  }),

  entregue: (d, c) => ({
    subject: `✅ Pedido ${d.numeroPedido} entregue! Como foi?`,
    html: layout(`
      <h2>Pedido entregue! ✅</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! O pedido <strong>${d.numeroPedido}</strong> foi entregue.</p>
      <p>Esperamos que tenha gostado! Sua opinião é muito importante para nós.</p>
      <div style="text-align:center;margin:24px 0">
        <p style="font-size:16px;font-weight:600;margin-bottom:8px">Como foi sua experiência?</p>
        <a href="${process.env.FRONTEND_URL}/pedidos?avaliar=${d.pedidoId}" class="btn">⭐ Avaliar entrega</a>
      </div>
      <div class="box">
        <p style="margin:0">📅 Sua próxima entrega já está agendada!</p>
      </div>
    `, c),
  }),

  item_em_falta: (d, c) => ({
    subject: `⚠️ Aviso: itens indisponíveis no seu pedido`,
    html: layout(`
      <h2>Aviso sobre seu pedido ⚠️</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! Infelizmente alguns itens estão temporariamente indisponíveis:</p>
      <div class="box box-warn">
        <ul style="margin:0;padding-left:20px">
          ${(d.itens || []).map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>
      <p>Seu pedido foi ajustado automaticamente. Se quiser alterar os itens da sua assinatura:</p>
      <a href="${process.env.FRONTEND_URL}/assinaturas" class="btn">Gerenciar assinatura</a>
    `, c),
  }),

  pagamento_recusado: (d, c) => ({
    subject: `❌ Pagamento recusado — Pedido ${d.numeroPedido}`,
    html: layout(`
      <h2 style="color:#c0392b">Pagamento recusado ❌</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! O pagamento do pedido <strong>${d.numeroPedido}</strong> não foi aprovado.</p>
      <div class="box box-warn">
        <p style="margin:0">Verifique os dados do cartão ou tente outro meio de pagamento.</p>
      </div>
      <a href="${d.linkPagamento}" class="btn">Tentar novamente</a>
    `, c),
  }),

  lembrete_proxima_entrega: (d, c) => ({
    subject: `📅 Sua entrega está chegando em 3 dias!`,
    html: layout(`
      <h2>Sua entrega está chegando! 📅</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! Sua próxima entrega está prevista para:</p>
      <div class="box" style="text-align:center">
        <p style="margin:0;font-size:20px;font-weight:700">${d.proximaEntrega}</p>
      </div>
      ${d.itens?.length ? `
      <p><strong>Itens previstos:</strong></p>
      <div class="itens">
        ${d.itens.map(i => `
          <div class="item-row">
            <span>${i.quantidade}× ${i.nome}</span>
          </div>`).join('')}
      </div>` : ''}
      <p>Ainda tem tempo para alterar os itens da sua assinatura:</p>
      <a href="${d.linkAlterar || process.env.FRONTEND_URL + '/assinaturas'}" class="btn">Gerenciar assinatura</a>
      <p style="font-size:13px;color:#888">As alterações precisam ser feitas com pelo menos 3 dias de antecedência.</p>
    `, c),
  }),

  avaliacao_agradecimento: (d, c) => ({
    subject: `⭐ Obrigado pela sua avaliação!`,
    html: layout(`
      <h2>Obrigado pelo feedback! ⭐</h2>
      <p>Olá, <strong>${d.clienteNome}</strong>! Recebemos sua avaliação.</p>
      <div style="text-align:center;margin:20px 0">
        <div class="stars">${'⭐'.repeat(d.nota)}</div>
        ${d.comentario ? `<p style="font-style:italic;color:#555">"${d.comentario}"</p>` : ''}
      </div>
      <p>Seu feedback nos ajuda a melhorar cada vez mais. Até a próxima entrega! 🌿</p>
    `, c),
  }),
};

async function enviar(email, tipo, dados, refs = {}, clienteId = null) {
  const template = TEMPLATES[tipo];
  if (!template) {
    console.warn(`[notificacao] Template não encontrado: ${tipo}`);
    return;
  }

  // Busca configurações do sistema para personalizar o e-mail
  let config = {};
  try {
    const { rows: [cfg] } = await db.query('SELECT * FROM configuracoes ORDER BY id LIMIT 1');
    if (cfg) config = cfg;
  } catch { /* usa defaults */ }

  const remetente = {
    name:  config.nome_negocio || process.env.BREVO_SENDER_NAME || 'AssínaSaas',
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@paparica.com.br',
  };

  const { subject, html } = template(dados, config);

  // Busca cliente_id pelo e-mail se não fornecido
  let cidFinal = clienteId;
  if (!cidFinal) {
    const { rows: [c] } = await db.query(
      'SELECT id FROM clientes WHERE email = $1', [email]
    ).catch(() => ({ rows: [] }));
    cidFinal = c?.id || null;
  }

  // Registra no log
  let logId = null;
  if (cidFinal) {
    const { rows: [log] } = await db.query(`
      INSERT INTO whatsapp_log
        (pedido_id, assinatura_id, cliente_id, telefone, tipo_mensagem, mensagem)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      refs.pedido_id     || null,
      refs.assinatura_id || null,
      cidFinal,
      email,
      tipo,
      subject,
    ]).catch(() => ({ rows: [] }));
    logId = log?.id;
  }

  try {
    await axios.post(BREVO_URL, {
      sender:      remetente,
      to:          [{ email }],
      subject,
      htmlContent: html,
    }, { headers: HEADERS });

    if (logId) {
      await db.query(
        'UPDATE whatsapp_log SET status_envio = $1, tentativas = tentativas + 1, enviado_em = NOW() WHERE id = $2',
        ['enviado', logId]
      ).catch(() => {});
    }

    console.log(`[notificacao] E-mail enviado: ${tipo} → ${email}`);
  } catch (err) {
    if (logId) {
      await db.query(
        'UPDATE whatsapp_log SET status_envio = $1, tentativas = tentativas + 1, erro = $2 WHERE id = $3',
        ['falhou', err.message, logId]
      ).catch(() => {});
    }
    console.error(`[notificacao] Falha ao enviar ${tipo} para ${email}:`, err.message);
  }
}

module.exports = { enviar };
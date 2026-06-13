// api/webhook.js - Recebe confirmação de pagamento do Mercado Pago
// Ao confirmar → busca figurinha gerada → envia por e-mail com Resend

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    // Só processar pagamentos aprovados
    if (type !== 'payment') {
      return res.status(200).json({ received: true });
    }

    // Buscar detalhes do pagamento no MP
    const paymentId = data?.id;
    if (!paymentId) return res.status(200).json({ received: true });

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await mpRes.json();

    // Só processar se aprovado
    if (payment.status !== 'approved') {
      return res.status(200).json({ received: true });
    }

    // Extrair email e pedidoId do external_reference
    const [email, pedidoId] = (payment.external_reference || '').split('|');
    if (!email) return res.status(200).json({ received: true });

    // Buscar figurinha gerada (do KV storage)
    // const { kv } = await import('@vercel/kv');
    // const keys = await kv.keys(`pedido:${email}:*`);
    // const pedido = keys.length ? await kv.get(keys[keys.length - 1]) : null;
    
    // Por enquanto, usar o pedidoId para buscar no blob
    // Você pode adaptar para usar KV ou outro storage
    const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/figurinhas/${pedidoId}.jpg`;

    // Enviar e-mail com a figurinha
    await resend.emails.send({
      from: 'Figurinha Copa 2026 <noreply@seudominio.com.br>',
      to: email,
      subject: '🏆 Sua Figurinha da Copa 2026 está pronta!',
      html: buildEmailHTML(payment.payer?.first_name || 'Craque', imageUrl),
      attachments: [
        {
          filename: 'figurinha-copa2026.jpg',
          path: imageUrl // Resend baixa e anexa
        }
      ]
    });

    console.log(`✅ Figurinha enviada para ${email}`);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    // Retornar 200 para o MP não retentar
    return res.status(200).json({ received: true });
  }
}

function buildEmailHTML(nome, imageUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #FFD700; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 0 auto; background: #FFD700; padding: 32px 20px; text-align: center; }
    .card { background: #fff; border-radius: 20px; padding: 28px; }
    h1 { font-size: 28px; color: #1B3FA0; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
    .subtitle { color: #1B3FA0; font-size: 16px; margin-bottom: 20px; }
    .figurinha-img { width: 220px; border-radius: 16px; display: block; margin: 0 auto 20px; border: 3px solid #1B3FA0; }
    .info { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 20px; }
    .info strong { color: #1B3FA0; }
    .footer { font-size: 12px; color: rgba(27,63,160,0.6); margin-top: 20px; }
    .btn { display: inline-block; background: #1B3FA0; color: #fff; text-decoration: none; 
           border-radius: 12px; padding: 14px 32px; font-size: 16px; font-weight: 700; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div style="font-size:48px">⚽</div>
      <h1>GOOLL!</h1>
      <p class="subtitle">Olá ${nome}, sua figurinha está pronta!</p>
      
      <img class="figurinha-img" src="${imageUrl}" alt="Sua Figurinha Copa 2026"/>
      
      <p class="info">
        Sua <strong>Figurinha Personalizada da Copa 2026</strong> está em anexo neste e-mail em alta qualidade, pronta para impressão!
        <br/><br/>
        <strong>📱 Dica:</strong> Imprima no tamanho 5x7 cm em papel fotográfico para o resultado mais bonito.
        <br/><br/>
        <strong>🏆 Sorteio:</strong> Você está participando do sorteio de <strong>MIL REAIS</strong> no dia 14/07/2026!
      </p>
      
      <a class="btn" href="${process.env.NEXT_PUBLIC_BASE_URL}/minha-area?email=${encodeURIComponent(nome)}">
        Ver Minha Área
      </a>
      
      <p class="info" style="margin-top:16px">
        Compartilhe nas redes sociais com <strong>#FigurinhaCopa2026</strong> 🇧🇷
      </p>
    </div>
    <p class="footer">
      Figurinha Copa 2026 • Suporte: suporte@seudominio.com.br<br/>
      Você recebeu este e-mail pois fez uma compra em nosso site.
    </p>
  </div>
</body>
</html>`;
}

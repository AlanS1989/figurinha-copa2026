// api/checkout.js - Cria preferência de pagamento no Mercado Pago

export default async function handler(req, res) {
  const { email, nome, pedidoId } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email obrigatório' });
  }

  try {
    // Criar preferência no Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [{
          title: `Figurinha Copa 2026 - ${nome || 'Personalizada'}`,
          description: 'Figurinha personalizada Copa do Mundo 2026 com foto e dados',
          unit_price: 12.90,
          quantity: 1,
          currency_id: 'BRL'
        }],
        payer: {
          email: email
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/sucesso?email=${encodeURIComponent(email)}`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/?erro=pagamento`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/aguardando?email=${encodeURIComponent(email)}`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`,
        external_reference: `${email}|${pedidoId || Date.now()}`,
        statement_descriptor: 'FIGURINHA COPA',
        expires: false
      })
    });

    const mpData = await mpResponse.json();

    if (mpData.init_point) {
      // Redirecionar direto para o checkout do Mercado Pago
      return res.redirect(302, mpData.init_point);
    } else {
      throw new Error('Erro ao criar preferência: ' + JSON.stringify(mpData));
    }

  } catch (error) {
    console.error('Erro checkout:', error);
    return res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
}

// api/checkout.js - Gateway de Pagamento
export default async function handler(req, res) {
  const { email, nome } = req.query;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        items: [{
          title: `Figurinha Oficial Copa 2026 - ${nome || 'Craque'}`,
          unit_price: 12.90,
          quantity: 1,
          currency_id: 'BRL'
        }],
        payer: { email: email },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/?sucesso=true`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/?erro=true`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook`
      })
    });

    const mpData = await mpResponse.json();
    if (mpData.init_point) return res.redirect(302, mpData.init_point);
    else throw new Error('Erro MP');
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao gerar Pix' });
  }
}

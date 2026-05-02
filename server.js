const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON
app.use(express.json());

// ── Servir index.html (fichier statique) ──────────────────────────────
app.use(express.static(path.join(__dirname)));

// ── Route API Stripe ──────────────────────────────────────────────────
app.options('/api/create-payment-intent', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(200).end();
});

app.post('/api/create-payment-intent', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { amount, currency = 'eur', customerEmail, customerName, orderDetails } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Montant invalide' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method_types: ['card'],
      receipt_email: customerEmail,
      description: `La Case Shop — ${orderDetails}`,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
        order_details: orderDetails,
        shop: 'La Case Shop Martinique',
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// ── Fallback → index.html pour toutes les autres routes ──────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ La Case Shop — serveur lancé sur le port ${PORT}`);
});

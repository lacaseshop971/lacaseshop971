const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('.'));

// ── Base de données JSON simple ──────────────────────────────────────────────
const DB_FILE = './orders.json';
function loadOrders() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function saveOrders(orders) {
  fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2));
}

// ── Nodemailer (Gmail) ───────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // Lacaseshop971@gmail.com
    pass: process.env.GMAIL_PASS,   // Mot de passe d'application Gmail
  },
});

// ── Templates email ──────────────────────────────────────────────────────────
function emailConfirmationClient(order) {
  return `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f1f0ec;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0deda;}
  .header{background:#080808;padding:28px 40px;display:flex;justify-content:space-between;align-items:center;}
  .logo{font-size:20px;font-weight:600;letter-spacing:3px;color:#f7f5f0;text-transform:uppercase;}
  .logo span{color:#e8121a;}
  .badge{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#e8121a;border:1px solid rgba(232,18,26,.5);padding:5px 12px;}
  .bar{background:#e8121a;padding:12px 40px;}
  .bar p{font-size:13px;font-weight:500;letter-spacing:.05em;text-transform:uppercase;color:#fff;margin:0;}
  .body{padding:36px 40px;}
  .ref{font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:#888;margin:0 0 6px;}
  .order-id{font-size:30px;font-weight:600;color:#0a0a0a;margin:0 0 4px;}
  .date{font-size:13px;color:#888;margin:0 0 28px;}
  hr{border:none;border-top:1px solid #ece9e4;margin:0 0 24px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;}
  .card{background:#f8f7f4;border-radius:8px;padding:16px 18px;}
  .card-label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#999;margin:0 0 6px;}
  .card-val{font-size:15px;font-weight:600;color:#0a0a0a;margin:0 0 4px;}
  .card-sub{font-size:12px;color:#555;margin:0;}
  .section-title{font-size:11px;font-weight:500;letter-spacing:.15em;text-transform:uppercase;color:#888;margin:0 0 12px;padding-bottom:10px;border-bottom:1px solid #ece9e4;}
  table{width:100%;border-collapse:collapse;margin-bottom:28px;}
  th{font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:#aaa;padding:0 0 10px;text-align:left;border-bottom:1px solid #ece9e4;}
  td{padding:10px 0;font-size:14px;color:#0a0a0a;border-bottom:1px solid #ece9e4;vertical-align:middle;}
  .total-box{background:#080808;border-radius:8px;padding:20px 24px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;}
  .total-label{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#888;}
  .total-amount{font-size:34px;font-weight:700;color:#e8121a;}
  .status-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:28px;display:flex;align-items:center;gap:12px;}
  .status-dot{width:10px;height:10px;border-radius:50%;background:#16a34a;flex-shrink:0;}
  .status-text{font-size:14px;font-weight:600;color:#15803d;}
  .status-sub{font-size:12px;color:#555;margin-top:2px;}
  .footer{background:#f8f7f4;border-top:1px solid #ece9e4;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;}
  .footer-logo{font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#0a0a0a;}
  .footer-logo span{color:#e8121a;}
  .footer-text{font-size:12px;color:#aaa;}
</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f0ec;padding:40px 16px;">
<tr><td align="center"><div class="wrap">
  <div class="header">
    <div class="logo">LA CASE<span> SHOP</span></div>
    <div class="badge">Commande confirmée</div>
  </div>
  <div class="bar"><p>✓ Paiement reçu — merci pour ta commande !</p></div>
  <div class="body">
    <p class="ref">Référence commande</p>
    <p class="order-id">${order.id}</p>
    <p class="date">${order.date}</p>
    <hr>
    <div class="info-grid">
      <div class="card">
        <p class="card-label">Client</p>
        <p class="card-val">${order.clientName}</p>
        <p class="card-sub">${order.clientEmail}</p>
      </div>
      <div class="card">
        <p class="card-label">Livraison</p>
        <p class="card-val" style="font-size:13px">${order.address}</p>
        <p class="card-sub">📱 ${order.phoneModel || 'Modèle non renseigné'}</p>
      </div>
    </div>
    <p class="section-title">Tes articles (${order.nbCoques} coque(s))</p>
    <table>
      <thead><tr><th>Produit</th><th style="text-align:center">Qté</th><th style="text-align:right">Prix</th></tr></thead>
      <tbody>${order.itemsHtml}</tbody>
    </table>
    <div class="total-box">
      <span class="total-label">Total payé</span>
      <span class="total-amount">${order.total}€</span>
    </div>
    <div class="status-box">
      <div class="status-dot"></div>
      <div>
        <div class="status-text">Commande confirmée</div>
        <div class="status-sub">Tu recevras un email dès que ta commande est expédiée 📦</div>
      </div>
    </div>
    <p style="font-size:13px;color:#555;line-height:1.7;">
      On prépare ta commande ! Si tu as des questions, réponds directement à cet email ou contacte-nous sur WhatsApp.<br><br>
      <strong>La Case Shop 🛍️</strong>
    </p>
  </div>
  <div class="footer">
    <div class="footer-logo">LA CASE<span> SHOP</span></div>
    <div class="footer-text">Martinique · Livraison rapide</div>
  </div>
</div></td></tr></table>
</body></html>`;
}

function emailStatusUpdate(order, newStatus) {
  const statusConfig = {
    'En préparation': { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '📦', msg: 'On prépare ta commande avec soin !' },
    'Expédiée':       { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: '🚚', msg: 'Ta commande est en route vers toi !' },
    'Livrée':         { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', msg: 'Ta commande est arrivée ! Profite bien de ta coque 🎉' },
  };
  const s = statusConfig[newStatus] || { color: '#888', bg: '#f8f7f4', border: '#e0deda', icon: '📋', msg: '' };
  return `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#f1f0ec;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0deda;}
  .header{background:#080808;padding:28px 40px;display:flex;justify-content:space-between;align-items:center;}
  .logo{font-size:20px;font-weight:600;letter-spacing:3px;color:#f7f5f0;text-transform:uppercase;}
  .logo span{color:#e8121a;}
  .body{padding:40px;}
  .icon{font-size:48px;text-align:center;margin-bottom:16px;}
  .title{font-size:26px;font-weight:700;color:#0a0a0a;text-align:center;margin-bottom:8px;}
  .sub{font-size:15px;color:#555;text-align:center;margin-bottom:32px;line-height:1.6;}
  .status-badge{display:inline-block;background:${s.bg};border:1px solid ${s.border};color:${s.color};font-size:14px;font-weight:700;padding:10px 24px;border-radius:30px;margin:0 auto 32px;display:block;text-align:center;width:fit-content;margin:0 auto 32px;}
  .order-card{background:#f8f7f4;border-radius:8px;padding:20px;margin-bottom:32px;}
  .order-ref{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#888;margin:0 0 4px;}
  .order-id{font-size:22px;font-weight:700;color:#0a0a0a;margin:0 0 8px;}
  .order-items{font-size:13px;color:#555;line-height:1.7;}
  .total{font-size:20px;font-weight:700;color:#e8121a;margin-top:8px;}
  .footer{background:#f8f7f4;border-top:1px solid #ece9e4;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;}
  .footer-logo{font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#0a0a0a;}
  .footer-logo span{color:#e8121a;}
</style></head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f0ec;padding:40px 16px;">
<tr><td align="center"><div class="wrap">
  <div class="header">
    <div class="logo">LA CASE<span> SHOP</span></div>
  </div>
  <div class="body">
    <div class="icon">${s.icon}</div>
    <div class="title">Commande ${newStatus} !</div>
    <div class="sub">${s.msg}</div>
    <div class="status-badge">${newStatus}</div>
    <div class="order-card">
      <p class="order-ref">Ta commande</p>
      <p class="order-id">${order.id}</p>
      <p class="order-items">${order.itemsText}</p>
      <p class="total">${order.total}€</p>
    </div>
    <p style="font-size:13px;color:#888;text-align:center;line-height:1.7;">
      Des questions ? Réponds à cet email ou contacte-nous sur WhatsApp.<br>
      <strong style="color:#0a0a0a;">La Case Shop 🛍️</strong>
    </p>
  </div>
  <div class="footer">
    <div class="footer-logo">LA CASE<span> SHOP</span></div>
    <div class="footer-text">Martinique · Livraison rapide</div>
  </div>
</div></td></tr></table>
</body></html>`;
}

// ── ROUTE : Créer PaymentIntent ──────────────────────────────────────────────
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'eur', customerEmail, customerName, orderDetails } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: 'Montant invalide' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      receipt_email: customerEmail,
      description: `La Case Shop — ${orderDetails}`,
      metadata: { customer_name: customerName, customer_email: customerEmail, order_details: orderDetails },
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── ROUTE : Enregistrer commande + envoyer emails ────────────────────────────
app.post('/api/save-order', async (req, res) => {
  try {
    const order = req.body;
    const orders = loadOrders();
    order.status = 'Confirmée';
    order.createdAt = new Date().toISOString();
    orders.unshift(order);
    saveOrders(orders);

    // Email confirmation → CLIENT
    await transporter.sendMail({
      from: `"La Case Shop" <${process.env.GMAIL_USER}>`,
      to: order.clientEmail,
      subject: `✅ Commande ${order.id} confirmée — La Case Shop`,
      html: emailConfirmationClient(order),
    });

    // Email notification → TOI (admin)
    const aliItems = order.items.map(i =>
      `• ${i.name}${i.color ? ' (' + i.color + ')' : ''} ×${i.qty} — https://aliexpress.com/wholesale?SearchText=${encodeURIComponent(i.name + ' phone case')}`
    ).join('\n');

    await transporter.sendMail({
      from: `"La Case Shop" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🛍️ NOUVELLE COMMANDE ${order.id} — ${order.clientName} — ${order.total}€`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#e8121a;">🛍️ Nouvelle commande — ${order.id}</h2>
          <p><strong>Client :</strong> ${order.clientName} (${order.clientEmail})<br>
          <strong>WhatsApp :</strong> ${order.clientTel || 'N/A'}<br>
          <strong>Modèle téléphone :</strong> ${order.phoneModel || 'Non renseigné'}<br>
          <strong>Adresse :</strong> ${order.address}<br>
          <strong>Total :</strong> <span style="color:#e8121a;font-size:20px;font-weight:bold;">${order.total}€</span></p>
          <h3>Articles à commander sur AliExpress :</h3>
          <pre style="background:#f8f7f4;padding:16px;border-radius:8px;">${aliItems}</pre>
          <a href="${process.env.SITE_URL}/admin" style="display:inline-block;background:#e8121a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;margin-top:16px;">
            Gérer la commande →
          </a>
        </div>`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── ROUTE : Liste commandes (admin) ─────────────────────────────────────────
app.get('/api/admin/orders', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) return res.status(401).json({ error: 'Non autorisé' });
  res.json(loadOrders());
});

// ── ROUTE : Mettre à jour statut commande ────────────────────────────────────
app.post('/api/admin/update-status', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_SECRET_KEY) return res.status(401).json({ error: 'Non autorisé' });

  try {
    const { orderId, newStatus } = req.body;
    const orders = loadOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return res.status(404).json({ error: 'Commande introuvable' });

    orders[idx].status = newStatus;
    orders[idx].updatedAt = new Date().toISOString();
    saveOrders(orders);

    // Notifier le client par email
    await transporter.sendMail({
      from: `"La Case Shop" <${process.env.GMAIL_USER}>`,
      to: orders[idx].clientEmail,
      subject: `📦 Commande ${orderId} — ${newStatus}`,
      html: emailStatusUpdate(orders[idx], newStatus),
    });

    res.json({ success: true, order: orders[idx] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── ROUTE : Page admin ───────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 La Case Shop — serveur démarré sur le port ${PORT}`));

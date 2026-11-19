const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Токен бота (краще задавати через змінну середовища BOT_TOKEN на хостингу)
const BOT_TOKEN = process.env.BOT_TOKEN || '8644240070:AAGSuoSgppI-LpvB2r5oX3xsymr-N6bWgNw';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Ініціалізація Firebase Admin для вашої бази hamka-game
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://hamka-game-default-rtdb.europe-west1.firebasedatabase.app'
});
const db = admin.database();

const app = express();
app.use(cors());
app.use(express.json());

// Перевірка, що сервер живий
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'hamka-star-invoice-server' });
});

// Створення інвойсу на 10 зірок (XTR) за Star Case (лут x5)
app.post('/create-star-invoice', async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }

    const payload = JSON.stringify({
      uid: String(uid),
      item: 'star_case',
      qty: 1
    });

    const invoiceLink = await bot.createInvoiceLink(
      'Star Case (x5 Loot)',
      'Лут x5: скіни, аватарки, титули та багато XP!',
      payload,
      '', // Обов'язково порожній рядок для Telegram Stars
      'XTR', // Валюта Telegram Stars
      [{ label: 'Star Case (x5 Loot)', amount: 10 }] // Ціна: 10 зірок
    );

    return res.json({ invoiceLink });
  } catch (err) {
    console.error('createInvoiceLink error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create invoice' });
  }
});

// Обов'язкове підтвердження pre_checkout_query для Telegram Stars
bot.on('pre_checkout_query', async (query) => {
  try {
    await bot.answerPreCheckoutQuery(query.id, true);
  } catch (err) {
    console.error('answerPreCheckoutQuery error:', err);
  }
});

// Нарахування Star Case користувачу в Firebase після успішної оплати
bot.on('message', async (msg) => {
  if (!msg.successful_payment) return;

  try {
    const payload = JSON.parse(msg.successful_payment.invoice_payload);
    const uid = payload.uid;
    const qty = Number(payload.qty) || 1;

    if (!uid) {
      console.error('No uid in successful_payment payload');
      return;
    }

    await db.ref(`users/${uid}/cases/star`).transaction((current) => {
      return (current || 0) + qty;
    });

    await bot.sendMessage(
      msg.chat.id,
      `⭐ Оплата 10 зірок пройшла успішно! Нараховано +${qty} Star Case (лут x5) у гру Hamka.`
    );
  } catch (err) {
    console.error('Error granting star case:', err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

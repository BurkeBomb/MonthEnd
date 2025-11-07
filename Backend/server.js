require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS matches (
      id SERIAL PRIMARY KEY,
      payment_id TEXT,
      bank_tx_id TEXT,
      amount NUMERIC,
      date_matched TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      match_id INTEGER REFERENCES matches(id),
      invoice_link TEXT,
      client_email TEXT,
      sent_at TIMESTAMP
    );
  `);
}
initDb().catch(err => console.error('DB init error', err));

// Email config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: +process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Match and email invoice
app.post('/api/match', async (req, res) => {
  const { paymentId, bankTxId, amount, clientEmail, invoiceHtml } = req.body;

  try {
    const match = await pool.query(
      `INSERT INTO matches(payment_id, bank_tx_id, amount)
       VALUES($1, $2, $3) RETURNING id`,
      [paymentId, bankTxId, amount]
    );

    const matchId = match.rows[0].id;
    const invoiceLink = `${process.env.INVOICE_BASE_URL}/invoice-${matchId}.pdf`;

    await pool.query(
      `INSERT INTO invoices(match_id, invoice_link, client_email, sent_at)
       VALUES($1, $2, $3, NOW())`,
      [matchId, invoiceLink, clientEmail]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: clientEmail,
      subject: `Invoice for Payment ${paymentId}`,
      html: invoiceHtml + `<p><a href="${invoiceLink}">Download Invoice</a></p>`
    });

    res.json({ success: true, matchId, invoiceLink });
  } catch (error) {
    console.error('Email error', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get past 4 months of matches
app.get('/api/matches', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, i.invoice_link, i.client_email
      FROM matches m
      LEFT JOIN invoices i ON m.id = i.match_id
      WHERE m.date_matched > NOW() - INTERVAL '4 months'
      ORDER BY m.date_matched DESC
    `);
    res.json({ success: true, records: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

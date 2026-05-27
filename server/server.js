import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const dataFile = path.join(publicDir, "js", "data.js");
const ordersFile = path.join(__dirname, "data", "orders.json");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const mercadoPago = process.env.MERCADO_PAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN })
  : null;

function readCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((cookie) => {
    const [key, ...value] = cookie.trim().split("=");
    return [key, decodeURIComponent(value.join("="))];
  }));
}

function sign(value) {
  return crypto.createHmac("sha256", process.env.ADMIN_SECRET || "change-me").update(value).digest("hex");
}

function isAdmin(req) {
  const cookies = readCookies(req);
  const token = cookies.nexora_admin;
  if (!token) return false;
  const [value, signature] = token.split(".");
  return Boolean(value && signature && sign(value) === signature);
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  res.status(401).json({ error: "Acesso administrativo necessario." });
}

async function ensureOrdersFile() {
  await fs.mkdir(path.dirname(ordersFile), { recursive: true });
  try {
    await fs.access(ordersFile);
  } catch {
    await fs.writeFile(ordersFile, "[]");
  }
}

async function readStoreData() {
  const source = await fs.readFile(dataFile, "utf8");
  const match = source.match(/const\s+NEXORA_DEFAULTS\s*=\s*([\s\S]*?);\s*$/);
  if (!match) throw new Error("Arquivo public/js/data.js nao contem NEXORA_DEFAULTS.");
  return Function(`"use strict"; return (${match[1]});`)();
}

async function writeStoreData(data) {
  const body = `const NEXORA_DEFAULTS = ${JSON.stringify(data, null, 2)};\n`;
  await fs.writeFile(dataFile, body, "utf8");
}

async function readOrders() {
  await ensureOrdersFile();
  return JSON.parse(await fs.readFile(ordersFile, "utf8"));
}

async function writeOrders(orders) {
  await ensureOrdersFile();
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2));
}

function orderEmailHtml(order) {
  const items = order.items.map((item) => `<li>${item.name} x${item.qty} - R$ ${Number(item.subtotal).toFixed(2)}</li>`).join("");
  return `
    <h1>Pedido ${order.id}</h1>
    <p>Obrigado por comprar na Nexora.</p>
    <p>Status: <strong>${order.status}</strong></p>
    <ul>${items}</ul>
    <p>Total: <strong>R$ ${Number(order.total).toFixed(2)}</strong></p>
  `;
}

async function sendOrderEmail(order, subject = "Recebemos seu pedido Nexora") {
  if (!process.env.SMTP_HOST || !order.customer?.email) return false;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: order.customer.email,
    subject,
    html: orderEmailHtml(order)
  });
  return true;
}

function normalizeBotProducts(payload) {
  const list = Array.isArray(payload) ? payload : payload.products || payload.items || payload.data || [];
  return list.map((item, index) => ({
    id: String(item.id || item.sku || item.product_id || `dropbot-${Date.now()}-${index}`),
    name: item.name || item.title || item.productName || "Produto importado",
    price: Number(item.price || item.sale_price || item.sellPrice || 0),
    image: item.image || item.image_url || item.thumbnail || item.images?.[0] || "",
    description: item.description || item.short_description || "Produto importado do Dropshipping Bot.",
    supplier: item.supplier || item.url || item.product_url || "",
    category: item.category || item.category_name || "Dropshipping"
  })).filter((item) => item.name && item.price > 0);
}

async function sendDropshippingOrder(order) {
  const data = await readStoreData();
  const bot = data.integrations?.dropshippingBot;
  if (!bot?.enabled || !bot?.orderEndpoint) return false;

  const response = await fetch(bot.orderEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bot.token ? { Authorization: `Bearer ${bot.token}` } : {})
    },
    body: JSON.stringify({
      orderId: order.id,
      customer: order.customer,
      items: order.items.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.qty,
        supplierUrl: item.supplier
      }))
    })
  });

  if (!response.ok) throw new Error(`Dropshipping Bot respondeu ${response.status}`);
  return true;
}

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.post("/api/admin/login", (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return res.status(500).json({ error: "Configure ADMIN_PASSWORD no servidor." });
  if (req.body.password !== expected) return res.status(401).json({ error: "Senha invalida." });
  const value = Date.now().toString(36);
  res.setHeader("Set-Cookie", `nexora_admin=${value}.${sign(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.setHeader("Set-Cookie", "nexora_admin=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/admin/state", requireAdmin, async (req, res) => {
  res.json(await readStoreData());
});

app.put("/api/admin/state", requireAdmin, async (req, res) => {
  await writeStoreData(req.body);
  res.json({ ok: true });
});

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  res.json(await readOrders());
});

app.post("/api/admin/dropshipping/import", requireAdmin, async (req, res) => {
  const data = await readStoreData();
  const bot = data.integrations?.dropshippingBot || {};
  if (!bot.productEndpoint) return res.status(400).json({ error: "Configure o endpoint de produtos do Dropshipping Bot." });

  const response = await fetch(bot.productEndpoint, {
    headers: {
      Accept: "application/json",
      ...(bot.token ? { Authorization: `Bearer ${bot.token}` } : {})
    }
  });
  if (!response.ok) return res.status(502).json({ error: `Dropshipping Bot respondeu ${response.status}` });

  const imported = normalizeBotProducts(await response.json());
  const currentById = new Map(data.products.map((product) => [product.id, product]));
  imported.forEach((product) => currentById.set(product.id, product));
  data.products = Array.from(currentById.values());
  await writeStoreData(data);
  res.json({ imported: imported.length, products: data.products });
});

app.post("/api/checkout", async (req, res) => {
  try {
    if (!mercadoPago) return res.status(500).json({ error: "Mercado Pago nao configurado no servidor." });
    const store = await readStoreData();
    const items = (req.body.items || []).map((cartItem) => {
      const product = store.products.find((entry) => entry.id === cartItem.id);
      if (!product) return null;
      const qty = Math.max(1, Number(cartItem.qty || 1));
      return { ...product, qty, subtotal: product.price * qty };
    }).filter(Boolean);
    if (!items.length) return res.status(400).json({ error: "Carrinho vazio." });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const order = {
      id: `NX-${Date.now()}`,
      customer: req.body.customer,
      items,
      total,
      status: "aguardando_pagamento",
      createdAt: new Date().toISOString()
    };
    const orders = await readOrders();
    orders.push(order);
    await writeOrders(orders);
    await sendOrderEmail(order);

    const preference = new Preference(mercadoPago);
    const response = await preference.create({
      body: {
        external_reference: order.id,
        notification_url: process.env.MP_WEBHOOK_URL,
        items: items.map((item) => ({
          id: item.id,
          title: item.name,
          quantity: item.qty,
          unit_price: Number(item.price),
          currency_id: "BRL"
        })),
        payer: {
          name: order.customer?.name,
          email: order.customer?.email,
          phone: { number: order.customer?.phone }
        },
        shipments: {
          receiver_address: {
            zip_code: order.customer?.zip,
            street_name: order.customer?.address
          }
        },
        back_urls: {
          success: process.env.SUCCESS_URL || `${process.env.PUBLIC_URL || ""}/checkout.html?status=success`,
          failure: process.env.FAILURE_URL || `${process.env.PUBLIC_URL || ""}/checkout.html?status=failure`,
          pending: process.env.PENDING_URL || `${process.env.PUBLIC_URL || ""}/checkout.html?status=pending`
        },
        auto_return: "approved"
      }
    });

    res.json({ orderId: order.id, init_point: response.init_point, sandbox_init_point: response.sandbox_init_point });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar checkout Mercado Pago.", details: error.message });
  }
});

app.post("/api/webhooks/mercadopago", async (req, res) => {
  res.sendStatus(200);
  try {
    if (!mercadoPago) return;
    const paymentId = req.body?.data?.id || req.query?.["data.id"];
    if (!paymentId) return;
    const payment = await new Payment(mercadoPago).get({ id: paymentId });
    const orderId = payment.external_reference;
    if (!orderId) return;

    const orders = await readOrders();
    const order = orders.find((entry) => entry.id === orderId);
    if (!order) return;
    order.status = payment.status === "approved" ? "pago" : payment.status;
    order.payment = {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      paidAt: payment.date_approved
    };
    await writeOrders(orders);

    if (order.status === "pago") {
      await sendOrderEmail(order, "Pagamento aprovado - pedido Nexora");
      try {
        order.fulfillmentSent = await sendDropshippingOrder(order);
        await writeOrders(orders);
      } catch (error) {
        order.fulfillmentError = error.message;
        await writeOrders(orders);
      }
    }
  } catch (error) {
    console.error("Webhook Mercado Pago:", error);
  }
});

app.use(express.static(publicDir));
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Nexora rodando em http://localhost:${port}`);
  console.log(`Admin protegido em http://localhost:${port}/admin`);
});

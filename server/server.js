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
const envFile = path.join(__dirname, ".env");
const ordersFile = path.join(__dirname, "data", "orders.json");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

function getMercadoPago() {
  return process.env.MERCADO_PAGO_ACCESS_TOKEN
    ? new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN })
    : null;
}

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

function parseEnv(text) {
  return Object.fromEntries(text.split(/\r?\n/).map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return null;
    const [key, ...value] = trimmed.split("=");
    return [key, value.join("=")];
  }).filter(Boolean));
}

async function readEnvConfig() {
  try {
    return parseEnv(await fs.readFile(envFile, "utf8"));
  } catch {
    return {};
  }
}

async function writeEnvConfig(updates) {
  const current = await readEnvConfig();
  const next = { ...current };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== "__KEEP__") next[key] = String(value);
  });
  const orderedKeys = [
    "PORT",
    "ADMIN_PASSWORD",
    "ADMIN_SECRET",
    "PUBLIC_URL",
    "MERCADO_PAGO_ACCESS_TOKEN",
    "MP_WEBHOOK_URL",
    "SUCCESS_URL",
    "FAILURE_URL",
    "PENDING_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_SECURE",
    "SMTP_USER",
    "SMTP_PASS",
    "MAIL_FROM",
    "DROPSHIPPING_ENABLED",
    "DROPSHIPPING_PRODUCT_ENDPOINT",
    "DROPSHIPPING_ORDER_ENDPOINT",
    "DROPSHIPPING_TOKEN"
  ];
  const keys = [...orderedKeys, ...Object.keys(next).filter((key) => !orderedKeys.includes(key))];
  const body = keys.filter((key) => next[key] !== undefined).map((key) => `${key}=${next[key]}`).join("\n") + "\n";
  await fs.writeFile(envFile, body, "utf8");
  Object.assign(process.env, next);
}

function maskedEnv(config) {
  return {
    port: config.PORT || "3000",
    adminPasswordSet: Boolean(config.ADMIN_PASSWORD),
    publicUrl: config.PUBLIC_URL || "",
    mercadoPagoAccessTokenSet: Boolean(config.MERCADO_PAGO_ACCESS_TOKEN),
    mpWebhookUrl: config.MP_WEBHOOK_URL || "",
    successUrl: config.SUCCESS_URL || "",
    failureUrl: config.FAILURE_URL || "",
    pendingUrl: config.PENDING_URL || "",
    smtpHost: config.SMTP_HOST || "",
    smtpPort: config.SMTP_PORT || "587",
    smtpSecure: config.SMTP_SECURE || "false",
    smtpUser: config.SMTP_USER || "",
    smtpPassSet: Boolean(config.SMTP_PASS),
    mailFrom: config.MAIL_FROM || "",
    dropshippingEnabled: config.DROPSHIPPING_ENABLED || "false",
    productEndpoint: config.DROPSHIPPING_PRODUCT_ENDPOINT || "",
    orderEndpoint: config.DROPSHIPPING_ORDER_ENDPOINT || "",
    dropshippingTokenSet: Boolean(config.DROPSHIPPING_TOKEN)
  };
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

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function firstMatch(html, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
  }
  return "";
}

function extractJsonLdProducts(html) {
  const scripts = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script[1].trim());
      const list = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] || [])];
      const product = list.find((item) => item?.["@type"] === "Product" || item?.["@type"]?.includes?.("Product"));
      if (product) return product;
    } catch {
      // Ignore malformed third-party JSON-LD.
    }
  }
  return null;
}

function productFromHtml(url, html) {
  const jsonLd = extractJsonLdProducts(html);
  const offer = Array.isArray(jsonLd?.offers) ? jsonLd.offers[0] : jsonLd?.offers;
  const image = Array.isArray(jsonLd?.image) ? jsonLd.image[0] : jsonLd?.image;
  const title = jsonLd?.name || firstMatch(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([\s\S]*?)<\/title>/i
  ]);
  const description = jsonLd?.description || firstMatch(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  ]);
  const priceText = offer?.price || firstMatch(html, [
    /"price"\s*:\s*"?([0-9]+(?:[.,][0-9]+)?)"?/i,
    /property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    /R\$\s*([0-9.]+,[0-9]{2})/i
  ]);
  const parsedPrice = Number(String(priceText).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return {
    id: `link-${crypto.createHash("sha1").update(url).digest("hex").slice(0, 10)}`,
    name: cleanText(title) || "Produto importado por link",
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0,
    image: image || firstMatch(html, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i
    ]),
    description: cleanText(description) || "Produto importado por link. Revise descricao, preco e imagem antes de publicar.",
    supplier: url,
    category: "Dropshipping"
  };
}

async function sendDropshippingOrder(order) {
  const enabled = process.env.DROPSHIPPING_ENABLED === "true";
  if (!enabled || !process.env.DROPSHIPPING_ORDER_ENDPOINT) return false;

  const response = await fetch(process.env.DROPSHIPPING_ORDER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.DROPSHIPPING_TOKEN ? { Authorization: `Bearer ${process.env.DROPSHIPPING_TOKEN}` } : {})
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

app.get("/api/admin/settings", requireAdmin, async (req, res) => {
  res.json(maskedEnv(await readEnvConfig()));
});

app.put("/api/admin/settings", requireAdmin, async (req, res) => {
  const body = req.body || {};
  const current = await readEnvConfig();
  const updates = {
    PORT: body.port || current.PORT || "3000",
    ADMIN_PASSWORD: body.adminPassword || "__KEEP__",
    ADMIN_SECRET: current.ADMIN_SECRET || crypto.randomBytes(24).toString("hex"),
    PUBLIC_URL: body.publicUrl || "",
    MERCADO_PAGO_ACCESS_TOKEN: body.mercadoPagoAccessToken || "__KEEP__",
    MP_WEBHOOK_URL: body.mpWebhookUrl || (body.publicUrl ? `${body.publicUrl.replace(/\/$/, "")}/api/webhooks/mercadopago` : ""),
    SUCCESS_URL: body.successUrl || (body.publicUrl ? `${body.publicUrl.replace(/\/$/, "")}/checkout.html?status=success` : ""),
    FAILURE_URL: body.failureUrl || (body.publicUrl ? `${body.publicUrl.replace(/\/$/, "")}/checkout.html?status=failure` : ""),
    PENDING_URL: body.pendingUrl || (body.publicUrl ? `${body.publicUrl.replace(/\/$/, "")}/checkout.html?status=pending` : ""),
    SMTP_HOST: body.smtpHost || "",
    SMTP_PORT: body.smtpPort || "587",
    SMTP_SECURE: body.smtpSecure || "false",
    SMTP_USER: body.smtpUser || "",
    SMTP_PASS: body.smtpPass || "__KEEP__",
    MAIL_FROM: body.mailFrom || body.smtpUser || "",
    DROPSHIPPING_ENABLED: body.dropshippingEnabled || "false",
    DROPSHIPPING_PRODUCT_ENDPOINT: body.productEndpoint || "",
    DROPSHIPPING_ORDER_ENDPOINT: body.orderEndpoint || "",
    DROPSHIPPING_TOKEN: body.dropshippingToken || "__KEEP__"
  };
  await writeEnvConfig(updates);
  res.json(maskedEnv(await readEnvConfig()));
});

app.post("/api/admin/product-from-link", requireAdmin, async (req, res) => {
  const url = req.body?.url;
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Informe um link http/https valido." });
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 NexoraProductImporter/1.0",
      Accept: "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) return res.status(502).json({ error: `Fornecedor respondeu ${response.status}` });
  const html = await response.text();
  res.json(productFromHtml(url, html));
});

app.post("/api/admin/dropshipping/import", requireAdmin, async (req, res) => {
  const data = await readStoreData();
  if (!process.env.DROPSHIPPING_PRODUCT_ENDPOINT) return res.status(400).json({ error: "Configure o endpoint de produtos dropshipping." });

  const response = await fetch(process.env.DROPSHIPPING_PRODUCT_ENDPOINT, {
    headers: {
      Accept: "application/json",
      ...(process.env.DROPSHIPPING_TOKEN ? { Authorization: `Bearer ${process.env.DROPSHIPPING_TOKEN}` } : {})
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
    const mercadoPago = getMercadoPago();
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
    const mercadoPago = getMercadoPago();
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

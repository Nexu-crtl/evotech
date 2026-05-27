import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

app.post("/api/create-preference", async (req, res) => {
  try {
    const { items, customer } = req.body;
    if (!items?.length) return res.status(400).json({ error: "Carrinho vazio." });

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.name,
          quantity: Number(item.qty),
          unit_price: Number(item.price),
          currency_id: "BRL"
        })),
        payer: {
          name: customer?.name,
          email: customer?.email,
          phone: { number: customer?.phone }
        },
        back_urls: {
          success: process.env.SUCCESS_URL || "http://localhost:3000/checkout.html?status=success",
          failure: process.env.FAILURE_URL || "http://localhost:3000/checkout.html?status=failure",
          pending: process.env.PENDING_URL || "http://localhost:3000/checkout.html?status=pending"
        },
        auto_return: "approved"
      }
    });

    res.json({ init_point: response.init_point, sandbox_init_point: response.sandbox_init_point });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar preferencia Mercado Pago.", details: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Nexora API rodando em http://localhost:${port}`);
});

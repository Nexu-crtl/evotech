# NEXORA

Loja virtual de dropshipping para eletronicos com duas areas separadas:

- `public/`: loja publica do cliente.
- `server/`: backend privado com painel admin, Mercado Pago, e-mail, pedidos e integracao Dropshipping Bot.

## O que mudou na arquitetura

O cliente nao acessa mais `admin.html` publico. O painel administrativo fica em:

```text
/admin
```

Esse painel so abre pelo servidor Node e exige `ADMIN_PASSWORD` configurado no `.env`.

Se voce hospedar apenas a pasta `public/`, tera uma loja estatica sem painel. Para checkout real, e-mail, pedidos e admin protegido, hospede o projeto com o backend `server/server.js`.

## Rodar localmente

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Depois acesse:

```text
Loja:  http://localhost:3000
Admin: http://localhost:3000/admin
```

No arquivo `server/.env`, configure:

```text
ADMIN_PASSWORD=sua-senha
ADMIN_SECRET=um-segredo-grande
MERCADO_PAGO_ACCESS_TOKEN=seu-token-mercado-pago
PUBLIC_URL=https://seu-dominio.com
MP_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/mercadopago
SMTP_HOST=smtp.seu-provedor.com
SMTP_USER=seu-email
SMTP_PASS=sua-senha
MAIL_FROM=Nexora <seu-email>
```

## Mercado Pago

O checkout usa Checkout Pro:

1. O cliente finaliza a compra na loja.
2. O backend cria uma preferencia no Mercado Pago.
3. O cliente paga no ambiente do Mercado Pago.
4. O webhook `/api/webhooks/mercadopago` atualiza o pedido.
5. Quando aprovado, o servidor envia e-mail ao cliente.
6. Se configurado, o servidor envia o pedido ao Dropshipping Bot.

Importante: nunca coloque `MERCADO_PAGO_ACCESS_TOKEN` no frontend.

## Dropshipping Bot

O painel tem uma area para configurar:

- endpoint para importar produtos;
- endpoint para enviar pedidos;
- token/API key.

Como a documentacao publica oficial do Dropshipping Bot nao ficou disponivel durante a criacao, o conector foi feito de forma configuravel. Ele aceita uma resposta JSON com array em `products`, `items`, `data` ou na raiz, e tenta mapear campos comuns como `id`, `sku`, `name`, `title`, `price`, `image`, `url` e `category`.

Quando voce tiver a URL/token oficiais da plataforma, basta inserir no painel.

## E-mail de comprovante

O envio usa SMTP via `nodemailer`. Configure seu SMTP no `.env`. O cliente recebe:

- e-mail de pedido recebido;
- e-mail de pagamento aprovado quando o Mercado Pago confirmar via webhook.

## Hospedagem

Para uma loja completa, use uma hospedagem Node como Render, Railway, VPS, Hostinger com Node, DigitalOcean, Fly.io ou similar.

Envie o repositorio inteiro para o GitHub, conecte esse repositorio na hospedagem e configure:

```text
Root/working directory: server
Build command: npm install
Start command: npm start
```

Se a hospedagem pedir pasta publica, use:

```text
public/
```

Mas nesse modo estatico o admin e o checkout real nao funcionam sozinhos.

## Estrutura

```text
.
├── public/
│   ├── index.html
│   ├── produto.html
│   ├── carrinho.html
│   ├── checkout.html
│   ├── css/styles.css
│   └── js/
│       ├── app.js
│       └── data.js
├── server/
│   ├── admin.html
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── README.md
```

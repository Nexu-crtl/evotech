# NEXORA

Sistema simples de e-commerce para dropshipping de produtos eletronicos, feito com HTML, CSS e JavaScript puro. Funciona em GitHub Pages porque a loja, o carrinho, o painel admin, SEO, redes sociais e campanhas usam `localStorage`.

## Recursos

- Loja responsiva de produtos eletronicos
- Carrinho com adicionar, remover, quantidade e total automatico
- Checkout com link Mercado Pago configuravel no painel
- API Node opcional para gerar preferencia Mercado Pago
- Painel admin simples em `admin.html`
- Produtos, fornecedores, SEO, Open Graph, redes e campanhas editaveis
- Modo claro e escuro salvo no navegador
- Estrutura leve para GitHub Pages

## Como usar localmente

Abra `index.html` diretamente no navegador ou use qualquer servidor estatico simples.

Exemplo com Node instalado:

```bash
npx serve .
```

## Painel administrativo

Acesse `admin.html`.

No painel voce pode:

- adicionar, editar e remover produtos;
- alterar preco, imagem, categoria e link do fornecedor;
- configurar meta title, description, keywords e Open Graph;
- configurar links de Instagram, TikTok, YouTube, WhatsApp e link personalizado;
- cadastrar campanhas e vincular produtos.

Os dados ficam no `localStorage` do navegador. Para transformar dados editados em conteudo inicial definitivo, copie os valores para `js/data.js`.

## Mercado Pago

### Modo GitHub Pages

1. Crie um link de pagamento ou checkout no Mercado Pago.
2. Abra `admin.html`.
3. Cole o link no campo `Mercado Pago checkout link`.
4. Salve.

Ao finalizar a compra, o cliente sera redirecionado para esse link.

### Modo API Node opcional

Para gerar preferencias automaticamente com API, entre na pasta `server`:

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Edite `.env` e insira seu `MERCADO_PAGO_ACCESS_TOKEN`.

Depois publique essa API em um servidor Node e cole a URL completa do endpoint no campo `Endpoint API Mercado Pago` do painel admin. Exemplo:

```text
https://seu-servidor.com/api/create-preference
```

Por seguranca, nunca coloque o access token no JavaScript publico do GitHub Pages.

## Publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie os arquivos do projeto para o repositorio.
3. No GitHub, abra `Settings` > `Pages`.
4. Em `Build and deployment`, escolha `Deploy from a branch`.
5. Selecione a branch `main` e a pasta `/root`.
6. Salve e aguarde o link publicado.

## Conectar dominio proprio

1. Em `Settings` > `Pages`, adicione seu dominio em `Custom domain`.
2. No painel DNS do dominio, crie os registros indicados pelo GitHub.
3. Para dominio raiz, use os registros `A` do GitHub Pages.
4. Para subdominio como `www`, use um registro `CNAME`.
5. Ative `Enforce HTTPS` quando o certificado estiver pronto.

## Estrutura

```text
.
├── index.html
├── produto.html
├── carrinho.html
├── checkout.html
├── admin.html
├── css/
│   └── styles.css
├── js/
│   ├── data.js
│   └── app.js
└── server/
    ├── server.js
    ├── package.json
    └── .env.example
```

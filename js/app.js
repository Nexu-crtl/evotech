(function () {
  const keys = {
    products: "nexora_products",
    cart: "nexora_cart",
    seo: "nexora_seo",
    socials: "nexora_socials",
    campaigns: "nexora_campaigns",
    theme: "nexora_theme",
    orders: "nexora_orders"
  };

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function seed() {
    if (!localStorage.getItem(keys.products)) write(keys.products, NEXORA_DEFAULTS.products);
    if (!localStorage.getItem(keys.seo)) write(keys.seo, NEXORA_DEFAULTS.seo);
    if (!localStorage.getItem(keys.socials)) write(keys.socials, NEXORA_DEFAULTS.socials);
    if (!localStorage.getItem(keys.campaigns)) write(keys.campaigns, NEXORA_DEFAULTS.campaigns);
    if (!localStorage.getItem(keys.cart)) write(keys.cart, []);
  }

  function products() {
    return read(keys.products, NEXORA_DEFAULTS.products);
  }

  function cart() {
    return read(keys.cart, []);
  }

  function seo() {
    return read(keys.seo, NEXORA_DEFAULTS.seo);
  }

  function socials() {
    return read(keys.socials, NEXORA_DEFAULTS.socials);
  }

  function campaigns() {
    return read(keys.campaigns, NEXORA_DEFAULTS.campaigns);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }

  function notify(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(window.nexoraToastTimer);
    window.nexoraToastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function applyTheme() {
    const stored = localStorage.getItem(keys.theme) || "dark";
    document.documentElement.dataset.theme = stored;
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
        document.documentElement.dataset.theme = next;
        localStorage.setItem(keys.theme, next);
      });
    });
  }

  function upsertMeta(selector, attr, value) {
    if (!value) return;
    let tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement("meta");
      const match = selector.match(/\[(name|property)="([^"]+)"\]/);
      if (match) tag.setAttribute(match[1], match[2]);
      document.head.appendChild(tag);
    }
    tag.setAttribute(attr, value);
  }

  function applySeo() {
    const config = seo();
    document.title = config.title || document.title;
    upsertMeta('meta[name="description"]', "content", config.description);
    upsertMeta('meta[name="keywords"]', "content", config.keywords);
    upsertMeta('meta[property="og:title"]', "content", config.ogTitle || config.title);
    upsertMeta('meta[property="og:description"]', "content", config.ogDescription || config.description);
    upsertMeta('meta[property="og:image"]', "content", config.ogImage);
  }

  function updateCartCount() {
    const total = cart().reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll(".cart-count").forEach((el) => {
      el.textContent = total;
    });
  }

  function addToCart(productId) {
    const current = cart();
    const existing = current.find((item) => item.id === productId);
    if (existing) existing.qty += 1;
    else current.push({ id: productId, qty: 1 });
    write(keys.cart, current);
    updateCartCount();
    notify("Produto adicionado ao carrinho.");
  }

  function setQty(productId, qty) {
    const next = cart().map((item) => item.id === productId ? { ...item, qty } : item).filter((item) => item.qty > 0);
    write(keys.cart, next);
    renderCart();
    updateCartCount();
  }

  function cartItems() {
    const allProducts = products();
    return cart().map((item) => {
      const product = allProducts.find((entry) => entry.id === item.id);
      return product ? { ...product, qty: item.qty, subtotal: product.price * item.qty } : null;
    }).filter(Boolean);
  }

  function renderProducts(filter = "") {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const query = filter.trim().toLowerCase();
    const list = products().filter((product) => {
      return [product.name, product.category, product.description].join(" ").toLowerCase().includes(query);
    });
    grid.innerHTML = list.map((product) => `
      <article class="product-card">
        <a href="produto.html?id=${encodeURIComponent(product.id)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
        </a>
        <div class="card-body">
          <p class="eyebrow">${escapeHtml(product.category || "Tech")}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <div class="price">${money.format(product.price)}</div>
          <div class="card-actions">
            <button class="button primary" data-add-cart="${escapeHtml(product.id)}">Adicionar</button>
            <a class="button ghost" href="produto.html?id=${encodeURIComponent(product.id)}">Ver</a>
          </div>
        </div>
      </article>
    `).join("") || `<div class="empty-state">Nenhum produto encontrado.</div>`;
  }

  function renderProductDetail() {
    const target = document.getElementById("productDetail");
    if (!target) return;
    const id = new URLSearchParams(location.search).get("id");
    const product = products().find((entry) => entry.id === id) || products()[0];
    if (!product) {
      target.innerHTML = `<div class="empty-state">Produto nao encontrado.</div>`;
      return;
    }
    target.innerHTML = `
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
      <article class="product-info">
        <p class="eyebrow">${escapeHtml(product.category || "Tech")}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="muted">${escapeHtml(product.description)}</p>
        <div class="price">${money.format(product.price)}</div>
        <button class="button primary" data-add-cart="${escapeHtml(product.id)}">Adicionar ao carrinho</button>
      </article>
    `;
  }

  function renderCampaigns() {
    const grid = document.getElementById("campaignGrid");
    if (!grid) return;
    const allProducts = products();
    grid.innerHTML = campaigns().map((campaign) => {
      const product = allProducts.find((item) => item.id === campaign.productId);
      return `
        <article class="campaign-card">
          <p class="eyebrow">Conteudo</p>
          <h3>${escapeHtml(campaign.title)}</h3>
          <p>${escapeHtml(campaign.text)}</p>
          ${product ? `<p class="muted">Produto: ${escapeHtml(product.name)}</p>` : ""}
          ${campaign.url ? `<a href="${escapeHtml(campaign.url)}" target="_blank" rel="noopener">Abrir conteudo</a>` : ""}
        </article>
      `;
    }).join("") || `<div class="empty-state">Nenhuma campanha cadastrada.</div>`;
  }

  function renderSocials() {
    const target = document.getElementById("socialLinks");
    if (!target) return;
    const labels = { instagram: "IG", tiktok: "TT", youtube: "YT", whatsapp: "WA", custom: "+" };
    target.innerHTML = Object.entries(socials())
      .filter(([, url]) => Boolean(url))
      .map(([name, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(name)}">${labels[name] || name[0].toUpperCase()}</a>`)
      .join("");
  }

  function renderCart() {
    const list = document.getElementById("cartList");
    const summary = document.getElementById("cartSummary");
    if (!list || !summary) return;
    const items = cartItems();
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    list.innerHTML = items.map((item) => `
      <article class="cart-item">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}">
        <div>
          <h3>${escapeHtml(item.name)}</h3>
          <p class="muted">${money.format(item.price)} cada</p>
        </div>
        <div class="qty-control" aria-label="Quantidade">
          <button data-qty="${escapeHtml(item.id)}" data-value="${item.qty - 1}">-</button>
          <strong>${item.qty}</strong>
          <button data-qty="${escapeHtml(item.id)}" data-value="${item.qty + 1}">+</button>
        </div>
        <button class="button danger" data-remove="${escapeHtml(item.id)}">Remover</button>
      </article>
    `).join("") || `<div class="empty-state">Seu carrinho esta vazio.</div>`;
    summary.innerHTML = `
      <h2>Resumo</h2>
      <div class="summary-row"><span>Itens</span><strong>${items.reduce((sum, item) => sum + item.qty, 0)}</strong></div>
      <div class="summary-row"><span>Total</span><strong>${money.format(total)}</strong></div>
      <a class="button primary" href="checkout.html" ${items.length ? "" : "aria-disabled='true'"}>Ir para checkout</a>
    `;
  }

  function renderCheckout() {
    const summary = document.getElementById("checkoutSummary");
    if (!summary) return;
    const items = cartItems();
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    summary.innerHTML = `
      <h2>Pedido</h2>
      ${items.map((item) => `<div class="summary-row"><span>${escapeHtml(item.name)} x${item.qty}</span><strong>${money.format(item.subtotal)}</strong></div>`).join("")}
      <div class="summary-row"><span>Total</span><strong>${money.format(total)}</strong></div>
    `;
  }

  async function handleCheckout(event) {
    event.preventDefault();
    const items = cartItems();
    if (!items.length) {
      notify("Adicione produtos ao carrinho antes de finalizar.");
      return;
    }
    const formData = Object.fromEntries(new FormData(event.currentTarget).entries());
    const order = {
      id: `NX-${Date.now()}`,
      customer: formData,
      items,
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
      status: "aguardando_pagamento",
      createdAt: new Date().toISOString()
    };
    const orders = read(keys.orders, []);
    orders.push(order);
    write(keys.orders, orders);

    const paymentConfig = seo();
    if (paymentConfig.mercadoPagoApi) {
      try {
        const response = await fetch(paymentConfig.mercadoPagoApi, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, customer: formData })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Falha ao gerar pagamento.");
        write(keys.cart, []);
        location.href = data.init_point || data.sandbox_init_point;
        return;
      } catch (error) {
        notify(`Nao foi possivel gerar o link Mercado Pago pela API: ${error.message}`);
      }
    }

    const checkoutLink = paymentConfig.mercadoPagoLink;
    if (checkoutLink) {
      write(keys.cart, []);
      location.href = checkoutLink;
      return;
    }

    const message = encodeURIComponent(`Pedido ${order.id} - Total ${money.format(order.total)}. Configure o link Mercado Pago no admin para redirecionar automaticamente.`);
    const whatsapp = socials().whatsapp;
    if (whatsapp) location.href = `${whatsapp}${whatsapp.includes("?") ? "&" : "?"}text=${message}`;
    else notify("Pedido criado. Configure o link Mercado Pago no painel admin.");
  }

  function fillForm(form, data) {
    Object.entries(data).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? "";
    });
  }

  function renderAdmin() {
    const productForm = document.getElementById("productForm");
    if (!productForm) return;
    const seoForm = document.getElementById("seoForm");
    const socialForm = document.getElementById("socialForm");
    const campaignForm = document.getElementById("campaignForm");
    const productSelect = document.getElementById("campaignProductSelect");
    const productList = document.getElementById("adminProductList");
    const campaignList = document.getElementById("adminCampaignList");

    fillForm(seoForm, seo());
    fillForm(socialForm, socials());
    productSelect.innerHTML = products().map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)}</option>`).join("");

    productList.innerHTML = products().map((product) => `
      <div class="admin-row">
        <div><strong>${escapeHtml(product.name)}</strong><p class="muted">${money.format(product.price)} | ${escapeHtml(product.category || "Sem categoria")}</p></div>
        <div class="form-actions">
          <button class="button ghost" data-edit-product="${escapeHtml(product.id)}">Editar</button>
          <button class="button danger" data-delete-product="${escapeHtml(product.id)}">Excluir</button>
        </div>
      </div>
    `).join("");

    campaignList.innerHTML = campaigns().map((campaign) => `
      <div class="admin-row">
        <div><strong>${escapeHtml(campaign.title)}</strong><p class="muted">${escapeHtml(campaign.text)}</p></div>
        <div class="form-actions">
          <button class="button ghost" data-edit-campaign="${escapeHtml(campaign.id)}">Editar</button>
          <button class="button danger" data-delete-campaign="${escapeHtml(campaign.id)}">Excluir</button>
        </div>
      </div>
    `).join("");
  }

  function bindAdmin() {
    const productForm = document.getElementById("productForm");
    if (!productForm) return;
    const seoForm = document.getElementById("seoForm");
    const socialForm = document.getElementById("socialForm");
    const campaignForm = document.getElementById("campaignForm");

    productForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(productForm).entries());
      const current = products();
      const id = data.id || data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const saved = { ...data, id, price: Number(data.price) };
      const next = current.some((item) => item.id === id) ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      write(keys.products, next);
      productForm.reset();
      renderAdmin();
    });

    seoForm.addEventListener("submit", (event) => {
      event.preventDefault();
      write(keys.seo, Object.fromEntries(new FormData(seoForm).entries()));
      applySeo();
      notify("SEO salvo.");
    });

    socialForm.addEventListener("submit", (event) => {
      event.preventDefault();
      write(keys.socials, Object.fromEntries(new FormData(socialForm).entries()));
      notify("Redes sociais salvas.");
    });

    campaignForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(campaignForm).entries());
      const current = campaigns();
      const id = data.id || `camp-${Date.now()}`;
      const saved = { ...data, id };
      const next = current.some((item) => item.id === id) ? current.map((item) => item.id === id ? saved : item) : [...current, saved];
      write(keys.campaigns, next);
      campaignForm.reset();
      renderAdmin();
    });

    document.getElementById("clearProductForm").addEventListener("click", () => productForm.reset());
    document.getElementById("clearCampaignForm").addEventListener("click", () => campaignForm.reset());
    document.getElementById("resetDemoData").addEventListener("click", () => {
      if (!confirm("Restaurar dados demonstrativos da Nexora?")) return;
      write(keys.products, NEXORA_DEFAULTS.products);
      write(keys.seo, NEXORA_DEFAULTS.seo);
      write(keys.socials, NEXORA_DEFAULTS.socials);
      write(keys.campaigns, NEXORA_DEFAULTS.campaigns);
      renderAdmin();
    });

    document.addEventListener("click", (event) => {
      const editProduct = event.target.closest("[data-edit-product]");
      const deleteProduct = event.target.closest("[data-delete-product]");
      const editCampaign = event.target.closest("[data-edit-campaign]");
      const deleteCampaign = event.target.closest("[data-delete-campaign]");

      if (editProduct) fillForm(productForm, products().find((item) => item.id === editProduct.dataset.editProduct));
      if (deleteProduct && confirm("Excluir produto?")) {
        write(keys.products, products().filter((item) => item.id !== deleteProduct.dataset.deleteProduct));
        renderAdmin();
      }
      if (editCampaign) fillForm(campaignForm, campaigns().find((item) => item.id === editCampaign.dataset.editCampaign));
      if (deleteCampaign && confirm("Excluir campanha?")) {
        write(keys.campaigns, campaigns().filter((item) => item.id !== deleteCampaign.dataset.deleteCampaign));
        renderAdmin();
      }
    });
  }

  function bindGlobalActions() {
    document.addEventListener("click", (event) => {
      const add = event.target.closest("[data-add-cart]");
      const qty = event.target.closest("[data-qty]");
      const remove = event.target.closest("[data-remove]");
      if (add) addToCart(add.dataset.addCart);
      if (qty) setQty(qty.dataset.qty, Number(qty.dataset.value));
      if (remove) setQty(remove.dataset.remove, 0);
    });

    const search = document.getElementById("productSearch");
    if (search) search.addEventListener("input", (event) => renderProducts(event.target.value));

    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) checkoutForm.addEventListener("submit", handleCheckout);
  }

  seed();
  applyTheme();
  applySeo();
  updateCartCount();
  renderProducts();
  renderProductDetail();
  renderCampaigns();
  renderSocials();
  renderCart();
  renderCheckout();
  renderAdmin();
  bindAdmin();
  bindGlobalActions();
})();

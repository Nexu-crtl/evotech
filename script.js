const products = [
  {
    id: "notebook-evo-14",
    name: "Notebook EvoBook Air 14",
    category: "notebooks",
    price: 4299,
    oldPrice: 4899,
    rating: 4.8,
    popular: 96,
    deal: true,
    stock: true,
    art: "laptop",
    colors: ["#c7f9ec", "#bfdbfe", "#0f766e"],
    description: "Intel i7, 16 GB RAM, SSD 512 GB e tela IPS para produtividade leve e elegante.",
    specs: ["Intel i7 13a geracao", "16 GB RAM", "SSD NVMe 512 GB", "Bateria para ate 12h"]
  },
  {
    id: "phone-nova-x",
    name: "Smartphone Nova X 5G",
    category: "smartphones",
    price: 2599,
    oldPrice: 2999,
    rating: 4.7,
    popular: 90,
    deal: true,
    stock: true,
    art: "phone",
    colors: ["#ffe4e6", "#bae6fd", "#2563eb"],
    description: "Tela AMOLED 120 Hz, camera tripla e carregamento rapido de 67 W.",
    specs: ["5G dual chip", "256 GB", "Camera 108 MP", "Carregamento 67 W"]
  },
  {
    id: "headset-pulse",
    name: "Headset Pulse Pro RGB",
    category: "games",
    price: 349,
    oldPrice: 499,
    rating: 4.9,
    popular: 98,
    deal: true,
    stock: true,
    art: "audio",
    colors: ["#fef3c7", "#fecaca", "#ef4444"],
    description: "Audio espacial, microfone removivel e almofadas confortaveis para longas partidas.",
    specs: ["Audio 7.1 virtual", "Microfone removivel", "Conexao USB-C", "Iluminacao RGB"]
  },
  {
    id: "keyboard-mecha",
    name: "Teclado MechaCore TKL",
    category: "acessorios",
    price: 429,
    oldPrice: 0,
    rating: 4.6,
    popular: 82,
    deal: false,
    stock: true,
    art: "laptop",
    colors: ["#e0f2fe", "#ddd6fe", "#4f46e5"],
    description: "Switches mecanicos, hot-swap, ABNT2 e macros programaveis.",
    specs: ["Switch brown", "Hot-swap", "ABNT2", "Software de macros"]
  },
  {
    id: "monitor-vision",
    name: "Monitor Vision 27 QHD",
    category: "games",
    price: 1799,
    oldPrice: 2199,
    rating: 4.8,
    popular: 93,
    deal: true,
    stock: false,
    art: "laptop",
    colors: ["#d1fae5", "#c4b5fd", "#111827"],
    description: "Painel QHD de 165 Hz com HDR e ajuste de altura para setups imersivos.",
    specs: ["27 polegadas", "QHD 165 Hz", "1 ms", "HDR10"]
  },
  {
    id: "camera-home",
    name: "Camera Smart Home 360",
    category: "casa",
    price: 289,
    oldPrice: 0,
    rating: 4.5,
    popular: 72,
    deal: false,
    stock: true,
    art: "home",
    colors: ["#ecfccb", "#bbf7d0", "#16a34a"],
    description: "Monitoramento 2K, visao noturna e audio bidirecional pelo app.",
    specs: ["Resolucao 2K", "Rotacao 360 graus", "Visao noturna", "Audio bidirecional"]
  },
  {
    id: "router-mesh",
    name: "Roteador Mesh EvoLink",
    category: "casa",
    price: 699,
    oldPrice: 849,
    rating: 4.7,
    popular: 78,
    deal: true,
    stock: true,
    art: "home",
    colors: ["#f8fafc", "#bae6fd", "#0891b2"],
    description: "Wi-Fi 6 com cobertura para casas grandes e controle parental integrado.",
    specs: ["Wi-Fi 6", "Ate 350 m2", "Controle parental", "App EvoLink"]
  },
  {
    id: "mouse-raptor",
    name: "Mouse Raptor 12K",
    category: "acessorios",
    price: 219,
    oldPrice: 279,
    rating: 4.4,
    popular: 68,
    deal: false,
    stock: true,
    art: "audio",
    colors: ["#fee2e2", "#fed7aa", "#f97316"],
    description: "Sensor 12.000 DPI, seis botoes e peso reduzido para jogos competitivos.",
    specs: ["12.000 DPI", "6 botoes", "RGB", "72 g"]
  },
  {
    id: "tablet-sketch",
    name: "Tablet SketchPad 11",
    category: "smartphones",
    price: 3199,
    oldPrice: 0,
    rating: 4.6,
    popular: 74,
    deal: false,
    stock: true,
    art: "phone",
    colors: ["#ede9fe", "#fce7f3", "#7c3aed"],
    description: "Tela grande, caneta inclusa e modo desktop para estudo, arte e trabalho.",
    specs: ["Tela 11 polegadas", "Caneta inclusa", "128 GB", "Modo desktop"]
  }
];

const combo = {
  id: "combo-evodesk",
  name: "Combo Setup EvoDesk",
  category: "games",
  price: 2599,
  oldPrice: 3199,
  rating: 4.9,
  popular: 100,
  deal: true,
  stock: true,
  art: "laptop",
  colors: ["#ccfbf1", "#fecdd3", "#172033"],
  description: "Monitor, teclado, mouse e suporte para criar um setup completo.",
  specs: ["Monitor 27 polegadas", "Teclado mecanico", "Mouse gamer", "Suporte articulado"]
};

const state = {
  cart: JSON.parse(localStorage.getItem("evotech-cart") || "[]"),
  favorites: JSON.parse(localStorage.getItem("evotech-favorites") || "[]"),
  coupon: "",
  filters: {
    search: "",
    category: "todos",
    sort: "popular",
    maxPrice: 8000,
    onlyDeals: false,
    onlyStock: false
  }
};

const formatCurrency = value => value.toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const productGrid = $("#productGrid");
const resultCount = $("#resultCount");
const cartDrawer = $("#cartDrawer");
const overlay = $("#overlay");
const cartItems = $("#cartItems");
const toast = $("#toast");

function saveState() {
  localStorage.setItem("evotech-cart", JSON.stringify(state.cart));
  localStorage.setItem("evotech-favorites", JSON.stringify(state.favorites));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function productStyle(product) {
  return `--product-bg: linear-gradient(135deg, ${product.colors[0]}, ${product.colors[1]}); --product-main: ${product.colors[2]};`;
}

function productArtClass(product) {
  if (product.art === "phone") return "phone-art";
  if (product.art === "audio") return "audio-art";
  if (product.art === "home") return "home-art";
  return "";
}

function applyFilters() {
  let list = [...products];
  const query = state.filters.search.trim().toLowerCase();

  if (query) {
    list = list.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }

  if (state.filters.category !== "todos") {
    list = list.filter(product => product.category === state.filters.category);
  }

  list = list.filter(product => product.price <= state.filters.maxPrice);

  if (state.filters.onlyDeals) {
    list = list.filter(product => product.deal);
  }

  if (state.filters.onlyStock) {
    list = list.filter(product => product.stock);
  }

  const sorters = {
    popular: (a, b) => b.popular - a.popular,
    menor: (a, b) => a.price - b.price,
    maior: (a, b) => b.price - a.price,
    avaliacao: (a, b) => b.rating - a.rating
  };

  return list.sort(sorters[state.filters.sort]);
}

function renderProducts() {
  const list = applyFilters();
  resultCount.textContent = `${list.length} produto${list.length === 1 ? "" : "s"} encontrado${list.length === 1 ? "" : "s"}`;

  if (!list.length) {
    productGrid.innerHTML = '<div class="empty-state">Nenhum produto encontrado. Ajuste os filtros para ver mais opcoes.</div>';
    return;
  }

  productGrid.innerHTML = list.map(product => {
    const isFavorite = state.favorites.includes(product.id);
    return `
      <article class="product-card">
        <div class="product-media" style="${productStyle(product)}">
          ${product.deal ? '<span class="badge">Oferta</span>' : ""}
          <button class="favorite ${isFavorite ? "active" : ""}" data-favorite="${product.id}" aria-label="Favoritar ${product.name}">♥</button>
          <div class="product-art ${productArtClass(product)}"></div>
        </div>
        <div class="product-body">
          <span class="rating">★ ${product.rating.toFixed(1)}</span>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="price-row">
            <div>
              ${product.oldPrice ? `<span class="old-price">${formatCurrency(product.oldPrice)}</span>` : ""}
              <div class="price">${formatCurrency(product.price)}</div>
              <span class="installments">ou 12x de ${formatCurrency(product.price / 12)}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="primary-button" data-add="${product.id}">Adicionar</button>
            <button class="secondary-button" data-view="${product.id}">Detalhes</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function findProduct(id) {
  return [...products, combo].find(product => product.id === id);
}

function addToCart(id) {
  const item = state.cart.find(entry => entry.id === id);
  if (item) {
    item.quantity += 1;
  } else {
    state.cart.push({ id, quantity: 1 });
  }
  saveState();
  renderCart();
  showToast("Produto adicionado ao carrinho.");
}

function changeQuantity(id, delta) {
  const item = state.cart.find(entry => entry.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(entry => entry.id !== id);
  }
  saveState();
  renderCart();
}

function renderCart() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cartCount").textContent = totalItems;

  if (!state.cart.length) {
    cartItems.innerHTML = '<div class="empty-state">Seu carrinho esta vazio.</div>';
  } else {
    cartItems.innerHTML = state.cart.map(item => {
      const product = findProduct(item.id);
      return `
        <article class="cart-item">
          <div class="cart-thumb" style="${productStyle(product)}"></div>
          <div>
            <h3>${product.name}</h3>
            <strong>${formatCurrency(product.price)}</strong>
            <div class="quantity-row">
              <div class="quantity-controls">
                <button data-qty="${product.id}" data-delta="-1">-</button>
                <span>${item.quantity}</span>
                <button data-qty="${product.id}" data-delta="1">+</button>
              </div>
              <button class="text-button" data-remove="${product.id}">Remover</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  const subtotal = state.cart.reduce((sum, item) => {
    const product = findProduct(item.id);
    return sum + product.price * item.quantity;
  }, 0);
  const discount = state.coupon === "EVOTECH10" ? subtotal * 0.1 : 0;
  const shipping = subtotal === 0 || subtotal >= 399 ? 0 : 29.9;
  const total = Math.max(subtotal - discount + shipping, 0);

  $("#subtotal").textContent = formatCurrency(subtotal);
  $("#discount").textContent = formatCurrency(discount);
  $("#shipping").textContent = shipping ? formatCurrency(shipping) : "Gratis";
  $("#total").textContent = formatCurrency(total);
}

function openCart() {
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
  cartDrawer.setAttribute("aria-hidden", "false");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
  cartDrawer.setAttribute("aria-hidden", "true");
}

function toggleFavorite(id) {
  if (state.favorites.includes(id)) {
    state.favorites = state.favorites.filter(item => item !== id);
    showToast("Produto removido dos favoritos.");
  } else {
    state.favorites.push(id);
    showToast("Produto salvo nos favoritos.");
  }
  saveState();
  renderProducts();
}

function openQuickView(id) {
  const product = findProduct(id);
  $("#quickViewContent").innerHTML = `
    <div class="quick-view-layout">
      <div class="product-media" style="${productStyle(product)}">
        ${product.deal ? '<span class="badge">Oferta</span>' : ""}
        <div class="product-art ${productArtClass(product)}"></div>
      </div>
      <div>
        <span class="rating">★ ${product.rating.toFixed(1)}</span>
        <h2>${product.name}</h2>
        <p>${product.description}</p>
        <ul class="spec-list">
          ${product.specs.map(spec => `<li>${spec}</li>`).join("")}
        </ul>
        <div class="price">${formatCurrency(product.price)}</div>
        <p class="installments">12x de ${formatCurrency(product.price / 12)} sem juros</p>
        <button class="primary-button full" data-add="${product.id}">Adicionar ao carrinho</button>
      </div>
    </div>
  `;
  $("#quickView").showModal();
}

function syncInputs() {
  $("#searchInput").value = state.filters.search;
  $("#categoryFilter").value = state.filters.category;
  $("#sortFilter").value = state.filters.sort;
  $("#priceRange").value = state.filters.maxPrice;
  $("#priceValue").textContent = formatCurrency(state.filters.maxPrice).replace(",00", "");
  $("#onlyDeals").checked = state.filters.onlyDeals;
  $("#onlyStock").checked = state.filters.onlyStock;
  $$(".chip").forEach(chip => chip.classList.toggle("active", chip.dataset.category === state.filters.category));
}

function startCountdown() {
  let secondsLeft = 8 * 60 * 60;
  window.setInterval(() => {
    secondsLeft = Math.max(secondsLeft - 1, 0);
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    $("#hours").textContent = String(hours).padStart(2, "0");
    $("#minutes").textContent = String(minutes).padStart(2, "0");
    $("#seconds").textContent = String(seconds).padStart(2, "0");
  }, 1000);
}

document.addEventListener("click", event => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest("[data-favorite]");
  const viewButton = event.target.closest("[data-view]");
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");

  if (addButton) addToCart(addButton.dataset.add);
  if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);
  if (viewButton) openQuickView(viewButton.dataset.view);
  if (quantityButton) changeQuantity(quantityButton.dataset.qty, Number(quantityButton.dataset.delta));
  if (removeButton) {
    state.cart = state.cart.filter(item => item.id !== removeButton.dataset.remove);
    saveState();
    renderCart();
  }
});

$("#searchInput").addEventListener("input", event => {
  state.filters.search = event.target.value;
  renderProducts();
});

$("#categoryFilter").addEventListener("change", event => {
  state.filters.category = event.target.value;
  syncInputs();
  renderProducts();
});

$("#sortFilter").addEventListener("change", event => {
  state.filters.sort = event.target.value;
  renderProducts();
});

$("#priceRange").addEventListener("input", event => {
  state.filters.maxPrice = Number(event.target.value);
  syncInputs();
  renderProducts();
});

$("#onlyDeals").addEventListener("change", event => {
  state.filters.onlyDeals = event.target.checked;
  renderProducts();
});

$("#onlyStock").addEventListener("change", event => {
  state.filters.onlyStock = event.target.checked;
  renderProducts();
});

$$(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    state.filters.category = chip.dataset.category;
    syncInputs();
    renderProducts();
  });
});

$("#clearFilters").addEventListener("click", () => {
  state.filters = {
    search: "",
    category: "todos",
    sort: "popular",
    maxPrice: 8000,
    onlyDeals: false,
    onlyStock: false
  };
  syncInputs();
  renderProducts();
});

$("#openCart").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

$("#applyCoupon").addEventListener("click", () => {
  const coupon = $("#couponInput").value.trim().toUpperCase();
  if (coupon === "EVOTECH10") {
    state.coupon = coupon;
    showToast("Cupom EVOTECH10 aplicado.");
  } else {
    state.coupon = "";
    showToast("Cupom invalido. Tente EVOTECH10.");
  }
  renderCart();
});

$("[data-add-combo]").addEventListener("click", () => {
  addToCart(combo.id);
  openCart();
});

$("#checkoutButton").addEventListener("click", () => {
  if (!state.cart.length) {
    showToast("Adicione produtos antes de finalizar.");
    return;
  }
  $("#checkoutModal").showModal();
});

$("#checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  $("#orderMessage").textContent = "Pedido simulado com sucesso! Codigo EVO-" + Math.floor(Math.random() * 90000 + 10000);
  state.cart = [];
  state.coupon = "";
  saveState();
  renderCart();
});

$("#loginButton").addEventListener("click", () => $("#loginModal").showModal());
$(".login-form").addEventListener("submit", event => {
  event.preventDefault();
  $("#loginModal").close();
  showToast("Login demonstrativo realizado.");
});

$("[data-close-modal]").addEventListener("click", () => $("#quickView").close());
$("[data-close-login]").addEventListener("click", () => $("#loginModal").close());
$("[data-close-checkout]").addEventListener("click", () => $("#checkoutModal").close());

$("#themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("evotech-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

$("#menuToggle").addEventListener("click", () => $("#mainNav").classList.toggle("open"));

$$(".accordion-trigger").forEach(trigger => {
  trigger.addEventListener("click", () => {
    const content = trigger.nextElementSibling;
    content.classList.toggle("open");
  });
});

$("#chatButton").addEventListener("click", () => $("#chatBox").classList.add("open"));
$("#closeChat").addEventListener("click", () => $("#chatBox").classList.remove("open"));

$("#chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#chatInput");
  const question = input.value.trim();
  if (!question) return;
  $("#chatMessages").insertAdjacentHTML("beforeend", `<p><strong>Voce:</strong> ${question}</p>`);
  $("#chatMessages").insertAdjacentHTML("beforeend", "<p><strong>EvoCare:</strong> Obrigado! Em uma loja real, essa mensagem seria enviada ao atendimento.</p>");
  input.value = "";
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
});

$("#newsletterForm").addEventListener("submit", event => {
  event.preventDefault();
  $("#newsletterMessage").textContent = "Cadastro realizado. Bem-vindo ao EvoClub!";
  event.target.reset();
});

if (localStorage.getItem("evotech-theme") === "dark") {
  document.body.classList.add("dark");
}

syncInputs();
renderProducts();
renderCart();
startCountdown();

const NEXORA_DEFAULTS = {
  products: [
    {
      id: "nx-headset-pro",
      name: "Headset Bluetooth NexSound Pro",
      price: 189.9,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
      description: "Audio imersivo, cancelamento passivo e bateria de longa duracao para trabalho, estudo e games.",
      supplier: "https://www.aliexpress.com",
      category: "Audio"
    },
    {
      id: "nx-smartwatch-lite",
      name: "Smartwatch Fit AMOLED",
      price: 229.9,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
      description: "Tela AMOLED, monitoramento fitness e notificacoes inteligentes em um corpo leve.",
      supplier: "https://www.aliexpress.com",
      category: "Wearables"
    },
    {
      id: "nx-hub-usbc",
      name: "Hub USB-C 7 em 1",
      price: 149.9,
      image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=900&q=80",
      description: "Expanda seu notebook com HDMI, USB 3.0, leitor de cartao e carregamento rapido.",
      supplier: "https://www.aliexpress.com",
      category: "Acessorios"
    },
    {
      id: "nx-camera-smart",
      name: "Camera Wi-Fi Smart Home",
      price: 169.9,
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=900&q=80",
      description: "Monitoramento remoto, visao noturna e alertas para deixar sua casa mais conectada.",
      supplier: "https://www.aliexpress.com",
      category: "Smart Home"
    }
  ],
  seo: {
    title: "Nexora | Eletronicos inteligentes para o seu setup",
    description: "Nexora: loja dropshipping de eletronicos, gadgets e acessorios para setups modernos.",
    keywords: "eletronicos, dropshipping, gadgets, tecnologia, fones, smart home",
    ogTitle: "Nexora | Eletronicos inteligentes",
    ogDescription: "Produtos eletronicos selecionados para comprar online com praticidade.",
    ogImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    mercadoPagoLink: "",
    mercadoPagoApi: "/api/checkout"
  },
  appearance: {
    brandName: "NEXORA",
    logoText: "N",
    primaryColor: "#083b7a",
    accentColor: "#6f42ff",
    successColor: "#62c99a",
    darkBackground: "#07111f",
    lightBackground: "#f5f7fb",
    cardRadius: 8,
    heroImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80",
    heroEyebrow: "Dropshipping tech selecionado",
    heroTitle: "NEXORA",
    heroText: "Eletronicos, gadgets e acessorios para transformar seu setup com compra simples, visual limpo e checkout rapido."
  },
  integrations: {
    dropshippingBot: {
      enabled: false
    }
  },
  socials: {
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    youtube: "https://youtube.com",
    whatsapp: "https://wa.me/5500000000000",
    custom: ""
  },
  campaigns: [
    {
      id: "camp-setup",
      title: "Setup mais produtivo",
      text: "Combine headset, hub USB-C e organizacao para criar uma mesa pronta para estudo e trabalho.",
      url: "https://www.youtube.com/shorts",
      productId: "nx-hub-usbc"
    },
    {
      id: "camp-smart-home",
      title: "Casa conectada sem complicacao",
      text: "Produtos simples para iniciar seu ecossistema smart home com seguranca e custo baixo.",
      url: "https://www.tiktok.com",
      productId: "nx-camera-smart"
    }
  ]
};

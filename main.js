(function () {
  "use strict";

  var ICONES = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 20l1.2-4.1A8.5 8.5 0 1 1 8.2 19L4 20Z"/><path fill="currentColor" d="M9 8.5c.3-.6.7-.6 1-.5l.6 1.400c.1.300-.4.800-.5 1 .6 1.200 1.500 2 2.700 2.600.2-.2.700-.8 1-.7l1.400.7c.1.200 0 .9-.5 1.300-.7.600-1.600.5-3-.1A7 7 0 0 1 9 11.500c-.2-1.200-.2-2.300 0-3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="currentColor"/></svg>',
    ifood: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v7m3-7v7m-6-3h6m-3 3v11m8-18v18m0-18c3 2 4 5 4 8h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cardapio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm0 13a3 3 0 0 1 3-3h11M9 8h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 8 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function pendente(v) { return !v || /SEU_/.test(v); }

  var zap = "https://wa.me/" + CONFIG.whatsappNumero + "?text=" + encodeURIComponent(CONFIG.whatsappMensagem);
  var insta = "https://instagram.com/" + CONFIG.instagramUsuario;
  var ifood = "https://www.ifood.com.br/delivery/blumenau-sc/doceria-da-malu-progresso/";
  var cardapio = pendente(CONFIG.cardapioUrl)
    ? "https://wa.me/" + CONFIG.whatsappNumero + "?text=" + encodeURIComponent("Olá, Malu! Gostaria de ver o cardápio.")
    : CONFIG.cardapioUrl;

  var LINKS = [
    { titulo: "Fazer pedido", sub: "Chame no WhatsApp",     href: zap,                   icone: "whatsapp",  destaque: true },
    { titulo: "Instagram",    sub: "Veja nossas novidades", href: insta,                 icone: "instagram" },
    { titulo: "iFood",        sub: "Peça pelo iFood",        href: ifood,                 icone: "ifood" },
    { titulo: "Cardápio",     sub: "Sabores e preços",      href: cardapio,              icone: "cardapio" }
  ];

  var toast = document.getElementById("toast");
  var timer;
  function avisar(msg) {
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("on"); }, 2600);
  }

  function criarLink(href, classe, conteudo, label) {
    var a = document.createElement("a");
    a.className = classe;
    if (label) a.setAttribute("aria-label", label);
    if (pendente(href)) {
      a.href = "#";
      a.classList.add("pendente");
      a.addEventListener("click", function (e) {
        e.preventDefault();
        avisar("Este link ainda não foi configurado.");
      });
    } else {
      a.href = href;
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    }
    a.innerHTML = conteudo;
    return a;
  }

  var ul = document.getElementById("links");
  LINKS.forEach(function (item, i) {
    var li = document.createElement("li");
    li.style.setProperty("--i", i);
    var html = '<span class="ico">' + ICONES[item.icone] + '</span>' +
               '<span class="txt"><strong>' + item.titulo + '</strong><small>' + item.sub + '</small></span>';
    li.appendChild(criarLink(item.href, "botao" + (item.destaque ? " botao-principal" : ""), html));
    ul.appendChild(li);
  });

  document.body.appendChild(criarLink(zap, "whatsapp-flutuante", ICONES.whatsapp, "Fazer pedido pelo WhatsApp"));

  var lista = document.getElementById("produtos");
  CONFIG.produtos.forEach(function (p, i) {
    var li = document.createElement("li");
    li.className = "produto";
    li.style.setProperty("--i", i);
    var visual = p.imagem
      ? '<img src="' + p.imagem + '" alt="' + p.nome + '" width="120" height="120" loading="lazy" decoding="async">'
      : '<span aria-hidden="true">' + p.emoji + '</span>';
    li.innerHTML = '<div class="produto-img">' + visual + '</div><h3>' + p.nome + '</h3><p>' + p.descricao + '</p>';
    lista.appendChild(li);
  });

  var fotos = [
    { nome: "Bolo", imagem: "img/bolo.jpg" },
    { nome: "Brigadeiro", imagem: "img/brigadeiro.jpg" },
    { nome: "Brigadeiro cento", imagem: "img/brigadeiro-cento.jpg" },
    { nome: "Cookies", imagem: "img/cookies.jpg" },
    { nome: "Empadão", imagem: "img/empadao.jpg" }
  ];
  var faixaFotos = document.getElementById("fotos");
  var indicadoresFotos = document.getElementById("indicadores-fotos");
  var janelaFotos = document.querySelector(".carrossel-janela");
  var botaoFotoAnterior = document.getElementById("foto-anterior");
  var botaoFotoProxima = document.getElementById("foto-proxima");

  if (fotos.length) {
    fotos.forEach(function (produto, i) {
      var slide = document.createElement("li");
      slide.className = "carrossel-slide";
      slide.innerHTML = '<img src="' + produto.imagem + '" alt="' + produto.nome + '" width="1200" height="800" decoding="async">' +
        '<span class="legenda-foto">' + produto.nome + '</span>';
      faixaFotos.appendChild(slide);

      var indicador = document.createElement("button");
      indicador.type = "button";
      indicador.className = "indicador-foto";
      indicador.setAttribute("aria-label", "Ir para foto " + (i + 1));
      indicador.addEventListener("click", function () {
        moverParaFoto(i);
      });
      indicadoresFotos.appendChild(indicador);
    });

    botaoFotoAnterior.hidden = false;
    botaoFotoProxima.hidden = false;
    function atualizarIndicador() {
      var centro = janelaFotos.getBoundingClientRect().left + janelaFotos.clientWidth / 2;
      var slides = Array.from(faixaFotos.children);
      var ativo = slides.reduce(function (maisProximo, slide, i) {
        var distancia = Math.abs(slide.getBoundingClientRect().left + slide.clientWidth / 2 - centro);
        return distancia < maisProximo.distancia ? { indice: i, distancia: distancia } : maisProximo;
      }, { indice: 0, distancia: Infinity }).indice;
      Array.from(indicadoresFotos.children).forEach(function (indicador, i) {
        if (i === ativo) indicador.setAttribute("aria-current", "true");
        else indicador.removeAttribute("aria-current");
      });
    }
    function moverParaFoto(indice) {
      var slide = faixaFotos.children[indice];
      var deslocamento = slide.getBoundingClientRect().left - faixaFotos.getBoundingClientRect().left;
      faixaFotos.scrollTo({
        left: faixaFotos.scrollLeft + deslocamento - (faixaFotos.clientWidth - slide.clientWidth) / 2,
        behavior: "smooth"
      });
    }
    function moverFoto(direcao) {
      var atual = Array.from(indicadoresFotos.children).findIndex(function (indicador) {
        return indicador.hasAttribute("aria-current");
      });
      var proximo = (atual + direcao + fotos.length) % fotos.length;
      moverParaFoto(proximo);
    }
    botaoFotoAnterior.addEventListener("click", function () { moverFoto(-1); });
    botaoFotoProxima.addEventListener("click", function () { moverFoto(1); });
    faixaFotos.addEventListener("scroll", atualizarIndicador, { passive: true });
    atualizarIndicador();
    setInterval(function () { moverFoto(1); }, 5000);
  } else {
    document.getElementById("galeria-vazia").hidden = false;
  }

  var redes = document.getElementById("redes");
  [
    { nome: "Instagram", href: insta, icone: "instagram" },
    { nome: "WhatsApp",  href: zap,   icone: "whatsapp" },
    { nome: "E-mail",    href: pendente(CONFIG.email) ? "" : "mailto:" + CONFIG.email, icone: "email" }
  ].forEach(function (r) {
    var li = document.createElement("li");
    li.appendChild(criarLink(r.href, "rede", ICONES[r.icone], r.nome));
    redes.appendChild(li);
  });

  var contatos = document.getElementById("contatos");
  [["Endereço", CONFIG.endereco], ["Horário", CONFIG.horario], ["E-mail", CONFIG.email]].forEach(function (c) {
    var li = document.createElement("li");
    li.innerHTML = '<span>' + c[0] + ':</span> ' + (pendente(c[1]) ? '<em>a preencher</em>' : c[1]);
    contatos.appendChild(li);
  });

  document.getElementById("ano").textContent = new Date().getFullYear();
})();

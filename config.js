/* ==========================================================
   ARQUIVO DE CONFIGURAÇÃO — edite apenas este arquivo
   para trocar links, contatos e produtos.
   Campos com "SEU_" ou vazios são tratados como pendentes.
   ========================================================== */
const CONFIG = {
  // WhatsApp: código do país + DDD + número, só dígitos. Ex.: 5511999999999
  whatsappNumero: "5547989285321",
  whatsappMensagem: "Olá, Malu! Vim pelo Instagram e gostaria de fazer um pedido.",

  instagramUsuario: "doceriasmaluu",      // sem @
  cardapioUrl: "",                         // link do PDF, Drive ou página do cardápio

  email: "marialuizabonamente@gmail.com",
  endereco: "Rua Bruno Schreiber, 1410 - Progresso",
  horario: "Seg a Sex: 10h às 20h | Sáb: 10h às 18h",

  // Produtos em destaque. "imagem" é opcional (ex.: "img/bolo-de-pote.jpg").
  produtos: [
    { nome: "Bolos de pote",   descricao: "Camadas macias e recheios cremosos.",   emoji: "🧁", imagem: "img/bolo-pote-un.jpg" },
    { nome: "Brigadeiros",     descricao: "Enrolados à mão, em vários sabores.",    emoji: "🍫", imagem: "img/brigadeiro-classico-un.jpg" },
    { nome: "Pipocas gourmet", descricao: "Crocantes, caramelizadas e coloridas.",  emoji: "🍿", imagem: "img/pipoca-saco-un.jpg"},
    { nome: "Cookies",         descricao: "Casquinha dourada, centro macio.",       emoji: "🍪", imagem: "img/cookie-un.jpg" },
    { nome: "Salgados",        descricao: "Para festas, lanches e encomendas.",     emoji: "🥟", imagem: "img/empadao-un.png" }
  ]
};

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const COLUMNS = [
  { id: 'todo',    name: 'A fazer',                       color: '#8a94a8', hint: 'Ainda não iniciadas' },
  { id: 'doing',   name: 'Em andamento',                  color: '#3b5bdb', hint: 'Em execução' },
  { id: 'ta',      name: 'TA',                            color: '#9c5bd6', hint: 'Em análise ou tratamento técnico' },
  { id: 'waiting', name: 'Aguardando retorno / Pausado',  color: '#e0902a', hint: 'Dependem de retorno externo' },
  { id: 'done',    name: 'Concluído',                     color: '#2b8a5a', hint: 'Finalizadas' }
];

const $ = (s, r = document) => r.querySelector(s);
const el = {
  board: $('#board'), subtitle: $('#subtitle'), modal: $('#modal'), form: $('#form'),
  search: $('#fSearch'), fPriority: $('#fPriority'), fClient: $('#fClient'), fOwner: $('#fOwner'),
  toast: $('#toast'), sidebar: $('#sidebar'), scrim: $('#scrim'),
  login: $('#login'), loginForm: $('#loginForm'), loginLoading: $('#loginLoading'), loginError: $('#loginError')
};

let tasks = [];
let view = 'all';
let editingId = null;
let dragging = false;
let pendingRender = false;
let unsubscribe = null;
let currentUser = null;
const lists = {};

/* ---------- Firebase ---------- */
const cfg = window.FIREBASE_CONFIG;
const configured = cfg && cfg.apiKey && !cfg.apiKey.startsWith('COLE');
let auth, tasksCol;

if (configured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  tasksCol = collection(db, 'tasks');
} else {
  el.loginLoading.hidden = true;
  el.loginForm.hidden = false;
  el.loginForm.innerHTML = '<h2>Configure o Firebase</h2><p class="notice">Preencha o arquivo <b>firebase-config.js</b> com as credenciais do seu projeto. Os passos estão no README.</p>';
}

const authMessages = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Este usuário foi desativado.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/user-not-found': 'Usuário não encontrado.'
};

function startListening() {
  unsubscribe = onSnapshot(tasksCol, snap => {
    tasks = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    refreshOptions();
    safeRender();
  }, err => {
    console.error(err);
    toast('Sem permissão ou conexão com o banco de dados');
  });
}

if (configured) {
  onAuthStateChanged(auth, user => {
    currentUser = user;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    el.loginLoading.hidden = true;
    if (user) {
      el.login.hidden = true;
      $('#userEmail').textContent = user.email;
      startListening();
    } else {
      tasks = []; render();
      el.login.hidden = false;
      el.loginForm.hidden = false;
      $('#userEmail').textContent = '';
    }
  });

  el.loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    el.loginError.textContent = '';
    try { await signInWithEmailAndPassword(auth, $('#lEmail').value.trim(), $('#lPassword').value); $('#lPassword').value = ''; }
    catch (err) { el.loginError.textContent = authMessages[err.code] || 'Não foi possível entrar.'; }
  });
  $('#btnForgot').addEventListener('click', async () => {
    const email = $('#lEmail').value.trim();
    if (!email) { el.loginError.textContent = 'Digite seu e-mail acima para receber o link.'; return; }
    try { await sendPasswordResetEmail(auth, email); el.loginError.textContent = 'Enviamos um link de redefinição para o seu e-mail.'; }
    catch (err) { el.loginError.textContent = authMessages[err.code] || 'Não foi possível enviar o e-mail.'; }
  });
  $('#btnLogout').addEventListener('click', () => signOut(auth));
}

// Executa uma gravação e informa falhas ao usuário
async function run(promise, okMsg) {
  try { await promise; if (okMsg) toast(okMsg); return true; }
  catch (err) { console.error(err); toast('Não foi possível salvar. Verifique permissões e conexão.'); return false; }
}

/* ---------- Dados de exemplo ---------- */
function demoTasks() {
  const d = n => new Date(Date.now() - n * 864e5).toISOString();
  const t = (title, client, sms, desc, owner, priority, category, status, ago) =>
    ({ title, client, sms, desc, owner, priority, category, status, createdAt: d(ago) });
  return [
    t('Erro ao emitir nota fiscal', 'Mercado Aurora', 'SMS-1042', 'Ao emitir NF-e o sistema retorna rejeição 539. Cliente já tentou duas vezes.', 'Camila Souza', 'Alta', 'Fiscal', 'todo', 0),
    t('Configurar novo usuário de acesso', 'Clínica Vida', 'SMS-1038', 'Criar usuário para a recepcionista com perfil restrito.', 'Rafael Lima', 'Baixa', 'Acesso', 'todo', 1),
    t('Relatório de vendas divergente', 'Padaria Estrela', 'SMS-1031', 'Total do relatório mensal não bate com o fechamento de caixa.', 'Camila Souza', 'Média', 'Relatórios', 'doing', 2),
    t('Lentidão ao abrir o cadastro de produtos', 'Mercado Aurora', 'SMS-1027', 'Tela demora mais de 30 segundos para carregar em um dos terminais.', 'Bruno Alves', 'Alta', 'Desempenho', 'doing', 3),
    t('Análise de falha na integração com o banco', 'Transportes Rota', 'SMS-1019', 'Arquivo de retorno bancário não está sendo conciliado automaticamente.', 'Bruno Alves', 'Alta', 'Integração', 'ta', 4),
    t('Ajuste de layout da etiqueta', 'Farmácia Central', 'SMS-1015', 'Etiqueta de gôndola está cortando o preço promocional.', 'Rafael Lima', 'Média', 'Impressão', 'ta', 5),
    t('Aguardando certificado digital renovado', 'Clínica Vida', 'SMS-1009', 'Cliente vai enviar o novo certificado A1 para instalação.', 'Camila Souza', 'Média', 'Fiscal', 'waiting', 7),
    t('Validar regra de comissão com a diretoria', 'Padaria Estrela', 'SMS-1002', 'Dúvida sobre o cálculo de comissão para vendas parceladas.', 'Rafael Lima', 'Baixa', 'Financeiro', 'waiting', 9),
    t('Migração de base de dados', 'Transportes Rota', 'SMS-0988', 'Base migrada e validada com o cliente.', 'Bruno Alves', 'Alta', 'Infraestrutura', 'done', 12),
    t('Treinamento do módulo de estoque', 'Farmácia Central', 'SMS-0974', 'Treinamento online realizado com a equipe de 4 pessoas.', 'Camila Souza', 'Baixa', 'Treinamento', 'done', 14)
  ];
}

/* ---------- Utilidades ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDateTime = iso => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const icon = id => `<svg class="ic"><use href="#i-${id}"/></svg>`;
let toastTimer;
function toast(msg) {
  el.toast.textContent = msg; el.toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2200);
}

/* ---------- Filtros ---------- */
function matches(t) {
  const q = norm(el.search.value.trim());
  if (q && !(norm(t.title).includes(q) || norm(t.client).includes(q) || norm(t.sms).includes(q))) return false;
  if (el.fPriority.value && t.priority !== el.fPriority.value) return false;
  if (el.fClient.value && t.client !== el.fClient.value) return false;
  if (el.fOwner.value && t.owner !== el.fOwner.value) return false;
  if (view === 'open' && t.status === 'done') return false;
  if (view === 'high' && t.priority !== 'Alta') return false;
  if (view === 'waiting' && t.status !== 'waiting') return false;
  if (view === 'done' && t.status !== 'done') return false;
  return true;
}

function fillSelect(select, values, placeholder) {
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + values.map(v => `<option>${esc(v)}</option>`).join('');
  select.value = values.includes(current) ? current : '';
}
const uniq = key => [...new Set(tasks.map(t => t[key]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

function refreshOptions() {
  fillSelect(el.fClient, uniq('client'), 'Todos os clientes');
  fillSelect(el.fOwner, uniq('owner'), 'Todos os responsáveis');
  $('#dlClients').innerHTML = uniq('client').map(v => `<option value="${esc(v)}">`).join('');
  $('#dlOwners').innerHTML = uniq('owner').map(v => `<option value="${esc(v)}">`).join('');
  $('#dlCategories').innerHTML = uniq('category').map(v => `<option value="${esc(v)}">`).join('');
}

/* ---------- Renderização ---------- */
function buildBoard() {
  el.board.innerHTML = COLUMNS.map(c => `
    <section class="column" data-col="${c.id}">
      <div class="col-head"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}<span class="count" id="count-${c.id}">0</span></div>
      <p class="col-hint">${esc(c.hint)}</p>
      <div class="list" data-col="${c.id}"></div>
    </section>`).join('');
  COLUMNS.forEach(c => {
    const list = $(`.list[data-col="${c.id}"]`);
    lists[c.id] = list;
    Sortable.create(list, {
      group: 'tasks', animation: 160, ghostClass: 'sortable-ghost', chosenClass: 'sortable-chosen',
      delay: 160, delayOnTouchOnly: true, touchStartThreshold: 6,
      onStart: () => { dragging = true; },
      onEnd: onDrop
    });
  });
}

function cardHTML(t) {
  return `<article class="card p-${t.priority}" data-id="${t.id}" tabindex="0" role="button" aria-label="Abrir tarefa ${esc(t.title)}">
    <h3>${esc(t.title)}</h3>
    <div class="chips">
      <span class="client">${icon('building')}${esc(t.client)}</span>
      ${t.sms ? `<span class="sms">${esc(t.sms)}</span>` : ''}
    </div>
    ${t.desc ? `<p class="desc">${esc(t.desc)}</p>` : ''}
    <div class="meta">
      ${t.owner ? `<span>${icon('user')}${esc(t.owner)}</span>` : ''}
      ${t.category ? `<span>${icon('tag')}${esc(t.category)}</span>` : ''}
      <span class="badge b-${t.priority}">${t.priority}</span>
    </div>
  </article>`;
}

function render() {
  let shown = 0;
  COLUMNS.forEach(c => {
    const items = tasks.filter(t => t.status === c.id && matches(t));
    lists[c.id].innerHTML = items.map(cardHTML).join('');
    $(`#count-${c.id}`).textContent = items.length;
    shown += items.length;
  });
  const total = tasks.length;
  el.subtitle.textContent = shown === total
    ? `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`
    : `${shown} de ${total} tarefas`;
}

// Não redesenha o quadro enquanto alguém arrasta um card
function safeRender() {
  if (dragging) { pendingRender = true; return; }
  render();
}

/* ---------- Arrastar e soltar ---------- */
function onDrop(evt) {
  dragging = false;
  const card = evt.item;
  const task = tasks.find(t => t.id === card.dataset.id);
  if (!task) { render(); return; }
  const newStatus = evt.to.dataset.col;
  const orderOf = n => n && tasks.find(t => t.id === n.dataset.id)?.order;
  const po = orderOf(card.previousElementSibling);
  const no = orderOf(card.nextElementSibling);
  let order;
  if (po != null && no != null) order = (po + no) / 2;
  else if (po != null) order = po + 1;
  else if (no != null) order = no - 1;
  else order = Date.now();

  const changed = task.status !== newStatus || task.order !== order;
  if (changed) {
    // Atualização otimista; o Firestore confirma e sincroniza os outros usuários
    task.status = newStatus; task.order = order;
    tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    run(updateDoc(doc(tasksCol, task.id), { status: newStatus, order, updatedBy: currentUser?.email ?? '' }),
        evt.from !== evt.to ? `Movida para “${COLUMNS.find(c => c.id === newStatus).name}”` : null);
  }
  pendingRender = false;
  render();
}

/* ---------- Modal ---------- */
$('#mStatus').innerHTML = COLUMNS.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

function openModal(id) {
  editingId = id;
  const t = id ? tasks.find(x => x.id === id) : null;
  $('#modalTitle').textContent = t ? 'Editar tarefa' : 'Nova tarefa';
  $('#mTitle').value = t?.title ?? '';
  $('#mClient').value = t?.client ?? '';
  $('#mSms').value = t?.sms ?? '';
  $('#mOwner').value = t?.owner ?? '';
  $('#mCategory').value = t?.category ?? '';
  $('#mPriority').value = t?.priority ?? 'Média';
  $('#mStatus').value = t?.status ?? 'todo';
  $('#mDesc').value = t?.desc ?? '';
  $('#mCreated').textContent = t
    ? `Criada em ${fmtDateTime(t.createdAt)}${t.createdBy ? ' por ' + t.createdBy : ''}${t.updatedBy ? ' · Última alteração por ' + t.updatedBy : ''}`
    : 'A data de criação será preenchida automaticamente.';
  $('#btnDelete').style.display = t ? '' : 'none';
  el.modal.showModal();
  $('#mTitle').focus();
}
const closeModal = () => el.modal.close();

el.form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = {
    title: $('#mTitle').value.trim(),
    client: $('#mClient').value.trim(),
    sms: $('#mSms').value.trim(),
    owner: $('#mOwner').value.trim(),
    category: $('#mCategory').value.trim(),
    priority: $('#mPriority').value,
    status: $('#mStatus').value,
    desc: $('#mDesc').value.trim(),
    updatedBy: currentUser?.email ?? ''
  };
  if (!data.title || !data.client) return;
  let ok;
  if (editingId) {
    const t = tasks.find(x => x.id === editingId);
    if (t && t.status !== data.status) data.order = Date.now(); // vai para o fim da nova coluna
    ok = await run(updateDoc(doc(tasksCol, editingId), data), 'Tarefa atualizada');
  } else {
    ok = await run(addDoc(tasksCol, {
      ...data, order: Date.now(), createdAt: new Date().toISOString(), createdBy: currentUser?.email ?? ''
    }), 'Tarefa criada');
  }
  if (ok) closeModal();
});

$('#btnDelete').addEventListener('click', async () => {
  if (!editingId || !confirm('Excluir esta tarefa para todos? Essa ação não pode ser desfeita.')) return;
  if (await run(deleteDoc(doc(tasksCol, editingId)), 'Tarefa excluída')) closeModal();
});
$('#btnCancel').addEventListener('click', closeModal);
$('#btnClose').addEventListener('click', closeModal);
el.modal.addEventListener('click', e => { if (e.target === el.modal) closeModal(); });

/* ---------- Eventos gerais ---------- */
$('#btnNew').addEventListener('click', () => openModal(null));
el.board.addEventListener('click', e => {
  const card = e.target.closest('.card');
  if (card) openModal(card.dataset.id);
});
el.board.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) {
    e.preventDefault(); openModal(e.target.dataset.id);
  }
});

[el.search, el.fPriority, el.fClient, el.fOwner].forEach(i => i.addEventListener('input', render));
$('#btnClear').addEventListener('click', () => {
  el.search.value = ''; el.fPriority.value = ''; el.fClient.value = ''; el.fOwner.value = '';
  setView('all'); render();
});

function setView(v) {
  view = v;
  document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === v));
}
document.querySelectorAll('.nav-item[data-view]').forEach(b => b.addEventListener('click', () => {
  setView(b.dataset.view); render(); toggleMenu(false);
}));

$('#btnSeed').addEventListener('click', async () => {
  if (!confirm('Adicionar 10 tarefas de exemplo ao quadro compartilhado?')) return;
  const batch = writeBatch(tasksCol.firestore);
  const base = Date.now();
  demoTasks().forEach((t, i) => batch.set(doc(tasksCol), { ...t, order: base + i, createdBy: currentUser?.email ?? '' }));
  await run(batch.commit(), 'Exemplos adicionados');
  toggleMenu(false);
});

function toggleMenu(open) {
  el.sidebar.classList.toggle('open', open);
  el.scrim.classList.toggle('show', open);
}
$('#btnMenu').addEventListener('click', () => toggleMenu(true));
el.scrim.addEventListener('click', () => toggleMenu(false));

/* ---------- Início ---------- */
buildBoard();
render();

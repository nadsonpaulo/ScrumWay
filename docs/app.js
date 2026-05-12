const columns = ['stories','todo','inprogress','done'];
const fibonacci = [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377];
const defaultState = {
  currentUser: null,
  users: {
    admin: { 
      email: 'admin@example.com', 
      password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' // Hash de '123456'
    }
  },
  notes: {},
  productVision: {},
  dod: {},
  teamMembers: {},
  tasks: []
};

const VAULT_KEY = 'scrumway_vault';
const SALT = 'scrumway_salt_2024';

let state = { ...defaultState };
let currentVaultPassword = ''; // Mantido apenas em memória durante a sessão
let elements = {};
let editModal;

document.addEventListener('DOMContentLoaded', init);

// --- Funções de Criptografia ---

async function deriveKey(password) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(data, password) {
  const key = await deriveKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64, password) {
  try {
    const key = await deriveKey(password);
    const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (e) {
    return null;
  }
}

async function persistVault() {
  if (!currentVaultPassword) return;
  const encrypted = await encryptData(state, currentVaultPassword);
  localStorage.setItem(VAULT_KEY, encrypted);
}

async function saveState() {
  localStorage.setItem('scrumway_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  if (state.currentUser) {
    await persistVault();
  }
}

// --- Inicialização e Auth ---

function init() {
  if (window.self !== window.top) { window.top.location = window.self.location; return; }

  elements = {
    loginSection: document.getElementById('loginSection'),
    registerSection: document.getElementById('registerSection'),
    boardSection: document.getElementById('boardSection'),
    flashContainer: document.getElementById('flashContainer'),
    btnTheme: document.getElementById('btnTheme'),
    boardUsername: document.getElementById('boardUsername'),
    membersList: document.getElementById('membersList'),
    notesText: document.getElementById('notesText'),
    productVisionText: document.getElementById('productVisionText'),
    dodText: document.getElementById('dodText'),
    authButtons: document.getElementById('authButtons'),
    counts: {
      stories: document.getElementById('countStories'),
      todo: document.getElementById('countTodo'),
      inprogress: document.getElementById('countInProgress'),
      done: document.getElementById('countDone')
    }
  };

  const modalEl = document.getElementById('editTaskModal');
  if (modalEl) editModal = new bootstrap.Modal(modalEl);

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('createTaskForm').addEventListener('submit', handleCreateTask);
  document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
  document.getElementById('notesForm').addEventListener('submit', handleSaveNotes);
  document.getElementById('productVisionForm').addEventListener('submit', handleSaveProductVision);
  document.getElementById('dodForm').addEventListener('submit', handleSaveDod);
  
  document.getElementById('backToLoginFromRegister').addEventListener('click', () => showView('login'));
  document.getElementById('showRegister').addEventListener('click', () => showView('register'));
  
  document.getElementById('exportDataBtn').addEventListener('click', exportData);
  document.getElementById('importDataBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importData);

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('decrementPriority').addEventListener('click', () => adjustPriority(-1));
  document.getElementById('incrementPriority').addEventListener('click', () => adjustPriority(1));
  elements.btnTheme.addEventListener('click', toggleTheme);
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.selection-popup') && !e.target.closest('.badge-clickable')) {
      toggleSelectionPopup(false);
    }
  });

  const theme = localStorage.getItem('scrumway_theme');
  if (theme === 'dark') document.body.classList.add('dark');
  if (elements.btnTheme) elements.btnTheme.textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  
  showView('login');
  console.info('ScrumWay Vault Initialized');
}

async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  
  const vault = localStorage.getItem(VAULT_KEY);
  let loadedState = null;
  
  if (vault) {
    loadedState = await decryptData(vault, password);
  } else if (username === 'admin' && password === '123456') {
    loadedState = { ...defaultState };
  }

  if (!loadedState || !loadedState.users[username]) {
    return showFlash('Credenciais inválidas ou Cofre bloqueado.', 'danger');
  }

  currentVaultPassword = password;
  state = loadedState;
  state.currentUser = username;
  
  await persistVault();
  showFlash(`Cofre desbloqueado! Bem-vindo, ${username}!`, 'success');
  showView('board');
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirmPassword').value;

  if (username.length < 3) return showFlash('Usuário muito curto.', 'danger');
  if (password.length < 6) return showFlash('Senha deve ter no mínimo 6 caracteres.', 'danger');
  if (password !== confirm) return showFlash('As senhas não coincidem.', 'danger');
  if (localStorage.getItem(VAULT_KEY)) return showFlash('O sistema já possui um cofre.', 'warning');

  state.users[username] = { email: escapeHtml(email), password: await hashPassword(password) };
  state.notes[username] = '';
  state.productVision[username] = '';
  state.dod[username] = '';
  state.teamMembers[username] = [];
  
  currentVaultPassword = password;
  await persistVault();
  showFlash('Cofre criado com sucesso!', 'success');
  showView('login');
}

// --- Funções do Board ---

function renderBoard() {
  if (!state.currentUser) return;
  elements.boardUsername.textContent = state.currentUser;
  elements.notesText.value = state.notes[state.currentUser] || '';
  elements.productVisionText.value = state.productVision[state.currentUser] || '';
  elements.dodText.value = state.dod[state.currentUser] || '';

  const members = Array.isArray(state.teamMembers[state.currentUser]) ? state.teamMembers[state.currentUser] : [];
  elements.membersList.innerHTML = members.map(m => `
    <span class="team-member-badge" style="background:${m.color}; color:#fff;">
      ${escapeHtml(m.name)}
      <button class="btn-close btn-close-white ms-2" style="font-size:0.5rem" onclick="deleteMember('${escapeHtml(m.name)}')"></button>
    </span>
  `).join('');

  const userTasks = state.tasks.filter(t => t.owner === state.currentUser);
  columns.forEach(col => {
    const colTasks = userTasks.filter(t => t.column === col);
    const container = document.getElementById(`column${col === 'inprogress' ? 'InProgress' : capitalize(col)}`);
    if (container) container.innerHTML = colTasks.map(taskCard).join('');
    if (elements.counts[col]) elements.counts[col].textContent = colTasks.length;
  });
  enableDragAndDrop();
}

function taskCard(task) {
  const members = Array.isArray(state.teamMembers[state.currentUser]) ? state.teamMembers[state.currentUser] : [];
  const member = members.find(m => m.name === task.assignee);
  const color = member ? member.color : 'var(--border-light)';
  return `
    <div class="card task-card shadow-sm p-3" draggable="true" data-task-id="${task.id}" style="border-left: 4px solid ${color}">
      <h6 class="fw-bold mb-1">${escapeHtml(task.title)}</h6>
      <p class="text-muted small mb-3">${escapeHtml(task.description || '...')}</p>
      <div class="d-flex gap-2 mb-3">
        <span class="badge badge-clickable" style="background:${color}; color:#fff;" onclick="showSelection(this, '${task.id}', 'assignee')">👤 ${task.assignee}</span>
        <span class="badge badge-clickable badge-priority" onclick="showSelection(this, '${task.id}', 'priority')">🔥 ${task.priority}</span>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-light btn-sm" onclick="openEditModal('${task.id}')">✏️</button>
        <button class="btn btn-light btn-sm text-danger" onclick="deleteTask('${task.id}')">🗑️</button>
      </div>
    </div>`;
}

async function handleCreateTask(event) {
  event.preventDefault();
  state.tasks.push({
    id: crypto.randomUUID(),
    owner: state.currentUser,
    title: document.getElementById('newTaskTitle').value.trim(),
    description: document.getElementById('newTaskDescription').value.trim(),
    priority: '0',
    assignee: 'Não atribuído',
    column: 'stories',
    createdAt: new Date().toISOString()
  });
  await saveState();
  event.target.reset();
  renderBoard();
}

async function handleAddMember(event) {
  event.preventDefault();
  const name = document.getElementById('newMemberName').value.trim();
  const members = state.teamMembers[state.currentUser] || [];
  if (members.some(m => m.name === name)) return showFlash('Membro já existe.', 'danger');
  const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6'];
  members.push({ name, color: colors[members.length % colors.length] });
  state.teamMembers[state.currentUser] = members;
  await saveState();
  event.target.reset();
  renderBoard();
}

async function handleSaveNotes(e) { e.preventDefault(); state.notes[state.currentUser] = elements.notesText.value; await saveState(); showFlash('Notas salvas.'); }
async function handleSaveProductVision(e) { e.preventDefault(); state.productVision[state.currentUser] = elements.productVisionText.value; await saveState(); showFlash('Visão salva.'); }
async function handleSaveDod(e) { e.preventDefault(); state.dod[state.currentUser] = elements.dodText.value; await saveState(); showFlash('DoD salvo.'); }

function logout() { currentVaultPassword = ''; state.currentUser = null; showView('login'); }

function showView(view) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`${view}Section`).classList.remove('hidden');
  elements.authButtons.classList.toggle('hidden', view !== 'board');
  if (view === 'board') renderBoard();
}

function showFlash(message, type = 'info') {
  elements.flashContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">${message}<button type="button" class="btn-close" data-bs-alert="alert"></button></div>`;
  setTimeout(() => { const a = elements.flashContainer.querySelector('.alert'); if (a) a.remove(); }, 4000);
}

function escapeHtml(str) { return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

window.deleteMember = async function(name) {
  state.teamMembers[state.currentUser] = (state.teamMembers[state.currentUser] || []).filter(m => m.name !== name);
  await saveState(); renderBoard();
};

window.deleteTask = async function(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  await saveState(); renderBoard();
};

function enableDragAndDrop() {
  document.querySelectorAll('.task-card').forEach(card => {
    card.ondragstart = e => { e.dataTransfer.setData('text', card.dataset.taskId); card.classList.add('dragging'); };
    card.ondragend = () => card.classList.remove('dragging');
  });
  document.querySelectorAll('.task-list').forEach(list => {
    list.ondragover = e => { e.preventDefault(); list.classList.add('drag-over'); };
    list.ondragleave = () => list.classList.remove('drag-over');
    list.ondrop = async e => {
      e.preventDefault(); list.classList.remove('drag-over');
      const task = state.tasks.find(t => t.id === e.dataTransfer.getData('text'));
      if (task) { task.column = list.dataset.column; await saveState(); renderBoard(); }
    };
  });
}

window.showSelection = function(el, taskId, field) {
  const popup = document.getElementById('selectionPopup');
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  const options = field === 'assignee' 
    ? [{ label: 'Não atribuído', value: 'Não atribuído' }, ...(state.teamMembers[state.currentUser] || []).map(m => ({ label: m.name, value: m.name }))]
    : [...new Set(fibonacci)].map(f => ({ label: String(f), value: String(f) }));
  
  popup.innerHTML = '';
  options.forEach(opt => {
    const b = document.createElement('button');
    b.textContent = opt.label;
    b.onclick = async () => { task[field] = opt.value; await saveState(); renderBoard(); popup.classList.remove('visible'); };
    popup.appendChild(b);
  });
  const rect = el.getBoundingClientRect();
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
  popup.classList.add('visible');
};

function toggleSelectionPopup(show) { document.getElementById('selectionPopup').classList.toggle('visible', show); }

window.openEditModal = function(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskDescription').value = task.description;
  document.getElementById('editTaskPriority').value = task.priority;
  document.getElementById('editTaskColumn').value = task.column;
  const assigneeSelect = document.getElementById('editTaskAssignee');
  assigneeSelect.innerHTML = `<option value="Não atribuído">Não atribuído</option>` + 
    (state.teamMembers[state.currentUser] || []).map(m => `<option value="${m.name}">${m.name}</option>`).join('');
  assigneeSelect.value = task.assignee;
  if (editModal) editModal.show();
};

document.getElementById('editTaskForm').onsubmit = async e => {
  e.preventDefault();
  const task = state.tasks.find(t => t.id === document.getElementById('editTaskId').value);
  if (task) {
    task.title = document.getElementById('editTaskTitle').value;
    task.description = document.getElementById('editTaskDescription').value;
    task.priority = document.getElementById('editTaskPriority').value;
    task.column = document.getElementById('editTaskColumn').value;
    task.assignee = document.getElementById('editTaskAssignee').value;
    await saveState(); renderBoard(); if (editModal) editModal.hide();
  }
};

function adjustPriority(dir) {
  const input = document.getElementById('editTaskPriority');
  const uniqueFib = [...new Set(fibonacci)];
  const idx = uniqueFib.indexOf(Number(input.value));
  input.value = uniqueFib[Math.max(0, Math.min(uniqueFib.length - 1, (idx < 0 ? 0 : idx) + dir))];
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('scrumway_theme', isDark ? 'dark' : 'light');
  if (elements.btnTheme) elements.btnTheme.textContent = isDark ? 'Tema claro' : 'Tema escuro';
}

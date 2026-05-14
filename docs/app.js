const columns = ['stories','todo','inprogress','done'];
const fibonacci = [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377];
const defaultState = {
  currentUser: null,
  role: 'Team',
  notes: {},
  productVision: {},
  dod: {},
  teamMembers: {},
  tasks: []
};

const VAULT_PREFIX = 'scrumway_vault_';
const SESSION_KEY = 'scrumway_active_session';
const SALT = 'scrumway_salt_2024';

let state = { ...defaultState };
let currentVaultPassword = '';
let sessionHeartbeat = null;
let currentSessionID = crypto.randomUUID();
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
  if (!currentVaultPassword || !state.currentUser) return;
  const encrypted = await encryptData(state, currentVaultPassword);
  localStorage.setItem(VAULT_PREFIX + state.currentUser, encrypted);
}

async function saveState() {
  localStorage.setItem('scrumway_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  if (state.currentUser) await persistVault();
}

// --- Funções de Sessão ---

function startSession(username) {
  currentSessionID = crypto.randomUUID();
  const updateSession = () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      username,
      sessionID: currentSessionID,
      lastSeen: Date.now()
    }));
  };
  updateSession();
  if (sessionHeartbeat) clearInterval(sessionHeartbeat);
  sessionHeartbeat = setInterval(updateSession, 5000);

  window.onstorage = (e) => {
    if (e.key === SESSION_KEY) {
      const sess = JSON.parse(e.newValue || '{}');
      if (sess.username === state.currentUser && sess.sessionID !== currentSessionID) {
        logout();
        showFlash('Sessão encerrada: login detectado em outro local.', 'danger');
      }
    }
  };
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
    adminBtn: document.getElementById('adminBtn'),
    usersTableBody: document.getElementById('usersTableBody'),
    adminSection: document.getElementById('adminSection'),
    counts: {
      stories: document.getElementById('countStories'),
      todo: document.getElementById('countTodo'),
      inprogress: document.getElementById('countInProgress'),
      done: document.getElementById('countDone')
    }
  };
  const modalEl = document.getElementById('editTaskModal');
  if (modalEl) editModal = new bootstrap.Modal(modalEl);
  document.getElementById('loginForm').onsubmit = handleLogin;
  document.getElementById('registerForm').onsubmit = handleRegister;
  document.getElementById('createTaskForm').onsubmit = handleCreateTask;
  document.getElementById('addMemberForm').onsubmit = handleAddMember;
  document.getElementById('notesForm').onsubmit = handleSaveNotes;
  document.getElementById('productVisionForm').onsubmit = handleSaveProductVision;
  document.getElementById('dodForm').onsubmit = handleSaveDod;
  document.getElementById('backToLoginFromRegister').onclick = () => showView('login');
  document.getElementById('showRegister').onclick = () => showView('register');
  document.getElementById('exportDataBtn').onclick = exportData;
  document.getElementById('importDataBtn').onclick = () => document.getElementById('importFile').click();
  document.getElementById('importFile').onchange = importData;
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('decrementPriority').onclick = () => adjustPriority(-1);
  document.getElementById('incrementPriority').onclick = () => adjustPriority(1);
  document.getElementById('backToBoardFromAdmin').onclick = () => showView('board');
  document.getElementById('adminBtn').onclick = () => showView('admin');
  elements.btnTheme.onclick = toggleTheme;
  document.onclick = (e) => { if (!e.target.closest('.selection-popup') && !e.target.closest('.badge-clickable')) toggleSelectionPopup(false); };
  const theme = localStorage.getItem('scrumway_theme');
  if (theme === 'dark') document.body.classList.add('dark');
  if (elements.btnTheme) elements.btnTheme.textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
  showView('login');
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  const activeSession = JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  if (activeSession.username === username && (Date.now() - activeSession.lastSeen < 10000)) {
    return showFlash('Este usuário já possui uma sessão ativa em outra aba.', 'warning');
  }

  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return showFlash(errorData.error || 'Credenciais inválidas.', 'danger');
    }

    const data = await response.json();
    const vaultKey = VAULT_PREFIX + username;
    const vault = localStorage.getItem(vaultKey);
    
    // Salva o token de acesso
    sessionStorage.setItem('scrumway_token', data.token);

    // Se não houver vault para este usuário, inicializa um estado padrão
    let loadedState = (vault) ? await decryptData(vault, password) : { ...defaultState };

    if (!loadedState) {
        if (confirm('Sua senha foi validada pelo servidor, mas não conseguimos abrir o seu cofre local (provavelmente ele foi criado com uma senha anterior). \n\nDeseja DESCARTAR os dados locais antigos e iniciar um novo cofre com sua nova senha?')) {
            loadedState = { ...defaultState };
        } else {
            return showFlash('Acesso cancelado. O cofre local permanece bloqueado.', 'warning');
        }
    }

    currentVaultPassword = password;
    state = loadedState;
    state.currentUser = username;
    state.role = data.user.role;
    
    startSession(username);
    await persistVault();

    // Verifica se precisa trocar a senha obrigatoriamente
    if (data.user.force_password_change) {
        const forceModal = new bootstrap.Modal(document.getElementById('forceChangePasswordModal'));
        forceModal.show();
        return; // Para o fluxo de login normal até trocar a senha
    }
    
    // Mostra o botão de admin se for admin
    if (state.role === 'admin') {
        elements.adminBtn.classList.remove('hidden');
    } else {
        elements.adminBtn.classList.add('hidden');
    }

    showFlash(`Login realizado! Bem-vindo, ${username}!`, 'success');
    showView('board');
  } catch (err) {
    showFlash('Erro ao conectar com o servidor. Verifique se o backend está rodando.', 'danger');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirmPassword').value;

  if (username.length < 3) return showFlash('Usuário muito curto.', 'danger');
  if (password.length < 8) return showFlash('Senha deve ter no mínimo 8 caracteres.', 'danger');
  if (password !== confirm) return showFlash('As senhas não coincidem.', 'danger');

  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return showFlash(errorData.error || 'Erro ao registrar.', 'danger');
    }

    showFlash('Usuário cadastrado com sucesso! Agora você pode fazer login.', 'success');
    showView('login');
  } catch (err) {
    showFlash('Erro ao conectar com o servidor.', 'danger');
  }
}

function logout() { 
  if (sessionHeartbeat) clearInterval(sessionHeartbeat);
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('scrumway_token');
  currentVaultPassword = ''; 
  state.currentUser = null; 
  showView('login'); 
}

// --- API Helpers ---

async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem('scrumway_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    logout();
    showFlash('Sessão expirada. Por favor, faça login novamente.', 'danger');
    throw new Error('Unauthorized');
  }
  return response;
}

// --- Funções de UI ---

function renderBoard() {
  if (!state.currentUser) return;
  elements.boardUsername.textContent = state.currentUser;
  elements.notesText.value = state.notes[state.currentUser] || '';
  elements.productVisionText.value = state.productVision[state.currentUser] || '';
  elements.dodText.value = state.dod[state.currentUser] || '';
  const members = state.teamMembers[state.currentUser] || [];
  elements.membersList.innerHTML = members.map(m => `<span class="team-member-badge" style="background:${m.color}; color:#fff;">${escapeHtml(m.name)}<button class="btn-close btn-close-white ms-2" style="font-size:0.5rem" onclick="deleteMember('${escapeHtml(m.name)}')"></button></span>`).join('');
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
  const member = (state.teamMembers[state.currentUser] || []).find(m => m.name === task.assignee);
  const color = member ? member.color : 'var(--border-light)';
  return `<div class="card task-card shadow-sm p-3" draggable="true" data-task-id="${task.id}" style="border-left: 4px solid ${color}"><h6 class="fw-bold mb-1">${escapeHtml(task.title)}</h6><p class="text-muted small mb-3">${escapeHtml(task.description || '...')}</p><div class="d-flex gap-2 mb-3"><span class="badge badge-clickable" style="background:${color}; color:#fff;" onclick="showSelection(this, '${task.id}', 'assignee')">👤 ${task.assignee}</span><span class="badge badge-clickable badge-priority" onclick="showSelection(this, '${task.id}', 'priority')">🔥 ${task.priority}</span></div><div class="d-flex justify-content-end gap-2"><button class="btn btn-light btn-sm" onclick="openEditModal('${task.id}')">✏️</button><button class="btn btn-light btn-sm text-danger" onclick="deleteTask('${task.id}')">🗑️</button></div></div>`;
}

async function handleCreateTask(e) { e.preventDefault(); state.tasks.push({ id: crypto.randomUUID(), owner: state.currentUser, title: document.getElementById('newTaskTitle').value.trim(), description: document.getElementById('newTaskDescription').value.trim(), priority: '0', assignee: 'Não atribuído', column: 'stories', createdAt: new Date().toISOString() }); await saveState(); e.target.reset(); renderBoard(); }
async function handleAddMember(e) { e.preventDefault(); const name = document.getElementById('newMemberName').value.trim(); const members = state.teamMembers[state.currentUser] || []; if (members.some(m => m.name === name)) return showFlash('Membro já existe.', 'danger'); members.push({ name, color: ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6'][members.length % 5] }); state.teamMembers[state.currentUser] = members; await saveState(); e.target.reset(); renderBoard(); }
async function handleSaveNotes(e) { e.preventDefault(); state.notes[state.currentUser] = elements.notesText.value; await saveState(); showFlash('Notas salvas.'); }
async function handleSaveProductVision(e) { e.preventDefault(); state.productVision[state.currentUser] = elements.productVisionText.value; await saveState(); showFlash('Visão salva.'); }
async function handleSaveDod(e) { e.preventDefault(); state.dod[state.currentUser] = elements.dodText.value; await saveState(); showFlash('DoD salvo.'); }

function showView(v) { 
  document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden')); 
  document.getElementById(`${v}Section`).classList.remove('hidden'); 
  elements.authButtons.classList.toggle('hidden', v !== 'board' && v !== 'admin'); 
  if (v === 'board') renderBoard(); 
  if (v === 'admin') loadUsers();
}

async function loadUsers() {
  try {
    const response = await apiFetch('http://localhost:5000/api/admin/users');
    const users = await response.json();
    elements.usersTableBody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td><strong>${escapeHtml(user.username)}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td><span class="badge ${user.role === 'admin' ? 'bg-warning' : 'bg-info'} text-white">${escapeHtml(user.role === 'admin' ? 'Admin' : user.role)}</span></td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="openManageUserModal(${user.id}, '${escapeHtml(user.username)}', '${escapeHtml(user.role)}')">Gerenciar</button>
            ${user.username !== 'admin' ? `<button class="btn btn-outline-danger" onclick="deleteUser(${user.id})">Remover</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showFlash('Erro ao carregar usuários.', 'danger');
  }
}

window.openManageUserModal = (id, username, role) => {
    document.getElementById('manageUserId').value = id;
    document.getElementById('manageUsername').textContent = username;
    document.getElementById('editUserRole').value = role;
    document.getElementById('resetUserPassword').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('manageUserModal'));
    modal.show();
};

window.generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('resetUserPassword').value = password;
};

window.generateRegisterPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('registerPassword').value = password;
    document.getElementById('registerConfirmPassword').value = password;
};

window.generateForcePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('forceNewPassword').value = password;
};

window.submitForcePasswordChange = async () => {
    const password = document.getElementById('forceNewPassword').value;
    if (!password || password.length < 8) return showFlash('A nova senha deve ter no mínimo 8 caracteres.', 'danger');

    try {
        const response = await apiFetch('http://localhost:5000/api/change-password', {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        
        if (response.ok) {
            showFlash('Senha alterada com sucesso! Você já pode usar o sistema.', 'success');
            currentVaultPassword = password; // Atualiza a senha do cofre para a nova
            await persistVault(); // Salva o cofre com a nova senha
            bootstrap.Modal.getInstance(document.getElementById('forceChangePasswordModal')).hide();
            
            // Continua para o board
            if (state.role === 'admin') elements.adminBtn.classList.remove('hidden');
            showView('board');
        } else {
            const data = await response.json();
            showFlash(data.error || 'Erro ao alterar senha.', 'danger');
        }
    } catch (err) {
        showFlash('Erro ao conectar com o servidor.', 'danger');
    }
};

window.saveUserRole = async () => {
    const id = document.getElementById('manageUserId').value;
    const role = document.getElementById('editUserRole').value;
    
    try {
        const response = await apiFetch(`http://localhost:5000/api/admin/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role })
        });
        
        if (response.ok) {
            showFlash('Perfil atualizado com sucesso!', 'success');
            loadUsers();
            bootstrap.Modal.getInstance(document.getElementById('manageUserModal')).hide();
        } else {
            const data = await response.json();
            showFlash(data.error || 'Erro ao atualizar perfil.', 'danger');
        }
    } catch (err) {
        showFlash('Erro ao conectar com o servidor.', 'danger');
    }
};

window.saveUserPassword = async () => {
    const id = document.getElementById('manageUserId').value;
    const password = document.getElementById('resetUserPassword').value;
    
    if (!password || password.length < 8) return showFlash('Senha deve ter no mínimo 8 caracteres.', 'danger');

    try {
        const response = await apiFetch(`http://localhost:5000/api/admin/users/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ password })
        });
        
        if (response.ok) {
            showFlash('Senha redefinida com sucesso!', 'success');
            bootstrap.Modal.getInstance(document.getElementById('manageUserModal')).hide();
        } else {
            const data = await response.json();
            showFlash(data.error || 'Erro ao redefinir senha.', 'danger');
        }
    } catch (err) {
        showFlash('Erro ao conectar com o servidor.', 'danger');
    }
};

window.deleteUser = async (id) => {
  if (!confirm('Tem certeza que deseja remover este usuário?')) return;
  try {
    const response = await apiFetch(`http://localhost:5000/api/admin/users/${id}`, { method: 'DELETE' });
    if (response.ok) {
      showFlash('Usuário removido com sucesso.', 'success');
      loadUsers();
    } else {
      const data = await response.json();
      showFlash(data.error || 'Erro ao remover usuário.', 'danger');
    }
  } catch (err) {
    showFlash('Erro ao conectar com o servidor.', 'danger');
  }
};
function showFlash(m, t = 'info') { elements.flashContainer.innerHTML = `<div class="alert alert-${t} alert-dismissible fade show shadow-sm" role="alert">${m}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`; setTimeout(() => { const a = elements.flashContainer.querySelector('.alert'); if (a) a.remove(); }, 4000); }
function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
async function hashPassword(p) { const msg = new TextEncoder().encode(p); const hash = await crypto.subtle.digest('SHA-256', msg); return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''); }

window.deleteMember = async n => { state.teamMembers[state.currentUser] = (state.teamMembers[state.currentUser] || []).filter(m => m.name !== n); await saveState(); renderBoard(); };
window.deleteTask = async id => { state.tasks = state.tasks.filter(t => t.id !== id); await saveState(); renderBoard(); };

function enableDragAndDrop() {
  document.querySelectorAll('.task-card').forEach(c => { c.ondragstart = e => { e.dataTransfer.setData('text', c.dataset.taskId); c.classList.add('dragging'); }; c.ondragend = () => c.classList.remove('dragging'); });
  document.querySelectorAll('.task-list').forEach(l => { l.ondragover = e => { e.preventDefault(); l.classList.add('drag-over'); }; l.ondragleave = () => l.classList.remove('drag-over'); l.ondrop = async e => { e.preventDefault(); l.classList.remove('drag-over'); const t = state.tasks.find(t => t.id === e.dataTransfer.getData('text')); if (t) { t.column = l.dataset.column; await saveState(); renderBoard(); } }; });
}

window.showSelection = (el, id, f) => {
  const popup = document.getElementById('selectionPopup');
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  const opts = f === 'assignee' ? [{ label: 'Não atribuído', value: 'Não atribuído' }, ...(state.teamMembers[state.currentUser] || []).map(m => ({ label: m.name, value: m.name }))] : [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377].map(n => ({ label: String(n), value: String(n) }));
  popup.innerHTML = '';
  opts.forEach(o => { const b = document.createElement('button'); b.textContent = o.label; b.onclick = async () => { task[f] = o.value; await saveState(); renderBoard(); popup.classList.remove('visible'); }; popup.appendChild(b); });
  const r = el.getBoundingClientRect(); popup.style.left = `${r.left + window.scrollX}px`; popup.style.top = `${r.bottom + window.scrollY + 5}px`; popup.classList.add('visible');
};

function toggleSelectionPopup(s) { document.getElementById('selectionPopup').classList.toggle('visible', s); }

window.openEditModal = id => {
  const t = state.tasks.find(t => t.id === id); if (!t) return;
  document.getElementById('editTaskId').value = t.id; document.getElementById('editTaskTitle').value = t.title; document.getElementById('editTaskDescription').value = t.description; document.getElementById('editTaskPriority').value = t.priority; document.getElementById('editTaskColumn').value = t.column;
  const s = document.getElementById('editTaskAssignee'); s.innerHTML = `<option value="Não atribuído">Não atribuído</option>` + (state.teamMembers[state.currentUser] || []).map(m => `<option value="${m.name}">${m.name}</option>`).join(''); s.value = t.assignee;
  if (editModal) editModal.show();
};

document.getElementById('editTaskForm').onsubmit = async e => {
  e.preventDefault(); const t = state.tasks.find(t => t.id === document.getElementById('editTaskId').value);
  if (t) { t.title = document.getElementById('editTaskTitle').value; t.description = document.getElementById('editTaskDescription').value; t.priority = document.getElementById('editTaskPriority').value; t.column = document.getElementById('editTaskColumn').value; t.assignee = document.getElementById('editTaskAssignee').value; await saveState(); renderBoard(); if (editModal) editModal.hide(); }
};

function adjustPriority(d) { const i = document.getElementById('editTaskPriority'); const u = [...new Set(fibonacci)]; const idx = u.indexOf(Number(i.value)); i.value = u[Math.max(0, Math.min(u.length - 1, (idx < 0 ? 0 : idx) + d))]; }
function toggleTheme() { const d = document.body.classList.toggle('dark'); localStorage.setItem('scrumway_theme', d ? 'dark' : 'light'); if (elements.btnTheme) elements.btnTheme.textContent = d ? 'Tema claro' : 'Tema escuro'; }

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const a = document.createElement('a'); a.href = dataStr; a.download = `scrumway_backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(a); a.click(); a.remove();
}

function importData(event) {
  const file = event.target.files[0]; if (!file) return; const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imp = JSON.parse(e.target.result);
      if (!imp.users || !Array.isArray(imp.tasks)) throw new Error();
      state = { ...defaultState, ...imp, users: { ...defaultState.users, ...(imp.users || {}) }, tasks: Array.isArray(imp.tasks) ? imp.tasks : [] };
      await saveState(); showFlash('Dados restaurados com sucesso!', 'success'); setTimeout(() => location.reload(), 1500);
    } catch (err) { showFlash('Erro ao importar: O arquivo não é um backup válido.', 'danger'); }
  };
  reader.readAsText(file);
}

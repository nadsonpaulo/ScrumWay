const storageKey = 'scrumway_static_state';
const columns = ['stories','todo','inprogress','done'];
const fibonacci = [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377];
const defaultState = {
  currentUser: null,
  recoveryUser: null,
  users: {
    admin: { 
      email: 'admin@example.com', 
      password: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' // Hash de '123456'
    }
  },
  notes: { admin: '' },
  productVision: { admin: '' },
  dod: { admin: '' },
  teamMembers: { admin: [] },
  tasks: []
};

let state = loadState();
let elements = {};
let editModal;

document.addEventListener('DOMContentLoaded', init);

function loadState() {
  const raw = localStorage.getItem(storageKey);
  const data = raw ? JSON.parse(raw) : null;
  if (data && typeof data === 'object') {
    return {
      ...defaultState,
      ...data,
      users: { ...defaultState.users, ...(data.users || {}) },
      notes: { ...defaultState.notes, ...(data.notes || {}) },
      productVision: { ...defaultState.productVision, ...(data.productVision || {}) },
      dod: { ...defaultState.dod, ...(data.dod || {}) },
      teamMembers: { ...defaultState.teamMembers, ...(data.teamMembers || {}) },
      tasks: Array.isArray(data.tasks) ? data.tasks : []
    };
  }
  return JSON.parse(JSON.stringify(defaultState));
}

function saveState() { 
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    console.log('State saved');
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

function init() {
  // Proteção contra Clickjacking (impede que o app rode dentro de um iframe malicioso)
  if (window.self !== window.top) {
    window.top.location = window.self.location;
    return;
  }

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

  const debugBtn = document.getElementById('debugBtn');
  if (debugBtn) {
    debugBtn.addEventListener('click', () => {
      console.log('=== SCRUMWAY DEBUG ===', state);
      showFlash('Informações de debug impressas no console.', 'info');
    });
  }

  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('decrementPriority').addEventListener('click', () => adjustPriority(-1));
  document.getElementById('incrementPriority').addEventListener('click', () => adjustPriority(1));
  elements.btnTheme.addEventListener('click', toggleTheme);
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.selection-popup') && !e.target.closest('.badge-clickable')) {
      toggleSelectionPopup(false);
    }
  });

  setTheme();
  showView(state.currentUser ? 'board' : 'login');
  console.info('ScrumWay Initialized');
}

function setTheme() {
  const isDark = localStorage.getItem('scrumway_theme') === 'dark';
  document.body.classList.toggle('dark', isDark);
  if (elements.btnTheme) elements.btnTheme.textContent = isDark ? 'Tema claro' : 'Tema escuro';
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('scrumway_theme', isDark ? 'dark' : 'light');
  if (elements.btnTheme) elements.btnTheme.textContent = isDark ? 'Tema claro' : 'Tema escuro';
}

async function hashPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const user = state.users[username];
  
  if (!user) return showFlash('Credenciais inválidas.', 'danger');
  
  const hashedPassword = await hashPassword(password);
  
  // Migração: se a senha salva for a antiga em texto puro, atualiza para o hash
  if (user.password === password) {
    user.password = hashedPassword;
    saveState();
  } else if (user.password !== hashedPassword) {
    return showFlash('Credenciais inválidas.', 'danger');
  }
  
  state.currentUser = username;
  saveState();
  showFlash(`Bem-vindo de volta, ${username}!`, 'success');
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
  if (state.users[username]) return showFlash('Usuário já existe.', 'danger');

  state.users[username] = { 
    email: escapeHtml(email), 
    password: await hashPassword(password) 
  };
  state.notes[username] = '';
  state.productVision[username] = '';
  state.dod[username] = '';
  state.teamMembers[username] = [];
  
  saveState();
  showFlash('Conta criada! Agora você pode entrar.', 'success');
  showView('login');
}

function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `scrumway_backup_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      
      // Validação básica de esquema
      if (!imported.users || !Array.isArray(imported.tasks)) {
        throw new Error('Formato de backup inválido.');
      }
      
      // Mescla segura de estados
      state = { 
        ...defaultState, 
        ...imported,
        users: { ...defaultState.users, ...(imported.users || {}) },
        tasks: Array.isArray(imported.tasks) ? imported.tasks : []
      };
      
      saveState();
      showFlash('Dados restaurados com sucesso!', 'success');
      setTimeout(() => location.reload(), 1500);
    } catch (err) {
      showFlash('Erro ao importar: O arquivo não é um backup válido.', 'danger');
    }
  };
  reader.readAsText(file);
}

function handleCreateTask(event) {
  event.preventDefault();
  console.log('Creating task...');
  const title = document.getElementById('newTaskTitle').value.trim();
  const description = document.getElementById('newTaskDescription').value.trim();
  
  state.tasks.push({
    id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
    owner: state.currentUser,
    title,
    description,
    priority: '0',
    assignee: 'Não atribuído',
    column: 'stories',
    createdAt: new Date().toISOString()
  });
  
  saveState();
  showFlash('Tarefa adicionada.', 'success');
  event.target.reset();
  renderBoard();
}

function handleAddMember(event) {
  event.preventDefault();
  const name = document.getElementById('newMemberName').value.trim();
  const members = Array.isArray(state.teamMembers[state.currentUser]) ? state.teamMembers[state.currentUser] : [];
  
  if (members.some(m => m.name === name)) return showFlash('Membro já existe.', 'danger');
  
  const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444'];
  const color = colors[members.length % colors.length];
  
  members.push({ name, color });
  state.teamMembers[state.currentUser] = members;
  saveState();
  event.target.reset();
  renderBoard();
}

function handleSaveNotes(e) { e.preventDefault(); state.notes[state.currentUser] = document.getElementById('notesText').value; saveState(); showFlash('Notas salvas.'); }
function handleSaveProductVision(e) { e.preventDefault(); state.productVision[state.currentUser] = document.getElementById('productVisionText').value; saveState(); showFlash('Visão salva.'); }
function handleSaveDod(e) { e.preventDefault(); state.dod[state.currentUser] = document.getElementById('dodText').value; saveState(); showFlash('DoD salvo.'); }

function logout() {
  state.currentUser = null;
  saveState();
  showView('login');
}

function showView(view) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  const section = document.getElementById(`${view}Section`);
  if (section) section.classList.remove('hidden');

  if (elements.authButtons) {
    elements.authButtons.classList.toggle('hidden', view !== 'board');
  }
  if (view === 'board') renderBoard();
}

function showFlash(message, type = 'info') {
  if (!elements.flashContainer) return;
  elements.flashContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;
  setTimeout(() => {
    const alert = elements.flashContainer.querySelector('.alert');
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 4000);
}

function renderBoard() {
  if (!state.currentUser) return;
  document.getElementById('boardUsername').textContent = state.currentUser;
  document.getElementById('notesText').value = state.notes[state.currentUser] || '';
  document.getElementById('productVisionText').value = state.productVision[state.currentUser] || '';
  document.getElementById('dodText').value = state.dod[state.currentUser] || '';

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
    if (container) {
      container.innerHTML = colTasks.map(taskCard).join('');
    }
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
      <div class="d-flex justify-content-between align-items-start mb-2">
        <h6 class="mb-0 fw-bold">${escapeHtml(task.title)}</h6>
      </div>
      <p class="text-muted small mb-3">${escapeHtml(task.description || '...')}</p>
      <div class="d-flex gap-2 mb-3">
        <span class="badge badge-clickable" style="background:${color}; color:#fff;" onclick="showSelection(this, '${task.id}', 'assignee')">
          👤 ${task.assignee}
        </span>
        <span class="badge badge-clickable badge-priority" onclick="showSelection(this, '${task.id}', 'priority')">
          🔥 ${task.priority}
        </span>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-light btn-sm" onclick="openEditModal('${task.id}')">✏️</button>
        <button class="btn btn-light btn-sm text-danger" onclick="deleteTask('${task.id}')">🗑️</button>
      </div>
    </div>`;
}

function escapeHtml(str) { return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

window.deleteMember = function(name) {
  const members = Array.isArray(state.teamMembers[state.currentUser]) ? state.teamMembers[state.currentUser] : [];
  state.teamMembers[state.currentUser] = members.filter(m => m.name !== name);
  saveState();
  renderBoard();
};

window.deleteTask = function(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderBoard();
};

function enableDragAndDrop() {
  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', card.dataset.taskId); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.task-list').forEach(list => {
    list.addEventListener('dragover', e => { e.preventDefault(); list.classList.add('drag-over'); });
    list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
    list.addEventListener('drop', e => {
      e.preventDefault();
      list.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const task = state.tasks.find(t => t.id === id);
      if (task) { task.column = list.dataset.column; saveState(); renderBoard(); }
    });
  });
}

window.showSelection = function(el, taskId, field) {
  const popup = document.getElementById('selectionPopup');
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  popup.innerHTML = '';
  const members = Array.isArray(state.teamMembers[state.currentUser]) ? state.teamMembers[state.currentUser] : [];
  const options = field === 'assignee'
    ? [{ label: 'Não atribuído', value: 'Não atribuído' }, ...members.map(m => ({ label: m.name, value: m.name }))]
    : [...new Set(fibonacci)].map(f => ({ label: String(f), value: String(f) }));

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.label;
    btn.onclick = (e) => { 
      e.stopPropagation();
      task[field] = opt.value; 
      saveState(); 
      renderBoard(); 
      toggleSelectionPopup(false); 
    };
    popup.appendChild(btn);
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
  
  const members = Array.isArray(state.teamMembers[state.currentUser]) ? state.teamMembers[state.currentUser] : [];
  const assigneeSelect = document.getElementById('editTaskAssignee');
  assigneeSelect.innerHTML = `<option value="Não atribuído">Não atribuído</option>` + 
    members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
  assigneeSelect.value = task.assignee;
  
  if (editModal) editModal.show();
};

document.getElementById('editTaskForm').addEventListener('submit', e => {
  e.preventDefault();
  const id = document.getElementById('editTaskId').value;
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.title = document.getElementById('editTaskTitle').value;
    task.description = document.getElementById('editTaskDescription').value;
    task.priority = document.getElementById('editTaskPriority').value;
    task.column = document.getElementById('editTaskColumn').value;
    task.assignee = document.getElementById('editTaskAssignee').value;
    saveState();
    renderBoard();
    if (editModal) editModal.hide();
  }
});

function adjustPriority(dir) {
  const input = document.getElementById('editTaskPriority');
  const current = Number(input.value);
  const uniqueFib = [...new Set(fibonacci)];
  const idx = uniqueFib.indexOf(current);
  const next = Math.max(0, Math.min(uniqueFib.length - 1, (idx < 0 ? 0 : idx) + dir));
  input.value = uniqueFib[next];
}

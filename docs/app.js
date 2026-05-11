const storageKey = 'scrumway_static_state';
const columns = ['stories','todo','inprogress','done'];
const fibonacci = [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377];
const defaultState = {
  currentUser: null,
  recoveryUser: null,
  users: {
    admin: { email: 'admin@example.com', password: '123456' }
  },
  notes: { admin: '' },
  teamMembers: { admin: [] },
  tasks: []
};

const state = loadState();
const elements = {
  loginSection: document.getElementById('loginSection'),
  registerSection: document.getElementById('registerSection'),
  forgotSection: document.getElementById('forgotSection'),
  resetSection: document.getElementById('resetSection'),
  boardSection: document.getElementById('boardSection'),
  flashContainer: document.getElementById('flashContainer'),
  btnTheme: document.getElementById('btnTheme'),
  boardUsername: document.getElementById('boardUsername'),
  membersList: document.getElementById('membersList'),
  notesText: document.getElementById('notesText'),
  counts: {
    stories: document.getElementById('countStories'),
    todo: document.getElementById('countTodo'),
    inprogress: document.getElementById('countInProgress'),
    done: document.getElementById('countDone')
  }
};

const editModal = new bootstrap.Modal(document.getElementById('editTaskModal'));

init();

function loadState() {
  const raw = localStorage.getItem(storageKey);
  const data = raw ? JSON.parse(raw) : null;
  if (data && typeof data === 'object') {
    return {
      ...defaultState,
      ...data,
      users: { ...defaultState.users, ...(data.users || {}) },
      notes: { ...defaultState.notes, ...(data.notes || {}) },
      teamMembers: { ...defaultState.teamMembers, ...(data.teamMembers || {}) },
      tasks: Array.isArray(data.tasks) ? data.tasks : []
    };
  }
  localStorage.setItem(storageKey, JSON.stringify(defaultState));
  return JSON.parse(JSON.stringify(defaultState));
}

function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }

function init() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('forgotForm').addEventListener('submit', handleForgot);
  document.getElementById('resetForm').addEventListener('submit', handleReset);
  document.getElementById('createTaskForm').addEventListener('submit', handleCreateTask);
  document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
  document.getElementById('notesForm').addEventListener('submit', handleSaveNotes);
  document.getElementById('backToLoginFromRegister').addEventListener('click', () => showView('login'));
  document.getElementById('backToLoginFromForgot').addEventListener('click', () => showView('login'));
  document.getElementById('backToLoginFromReset').addEventListener('click', () => showView('login'));
  document.getElementById('showRegister').addEventListener('click', () => showView('register'));
  document.getElementById('showForgot').addEventListener('click', () => showView('forgot'));
  document.getElementById('debugBtn').addEventListener('click', () => {
    console.log('=== DEBUG INFO ===');
    console.log('Estado atual:', state);
    console.log('Usuários:', Object.keys(state.users));
    console.log('Usuário admin:', state.users.admin);
    console.log('localStorage:', localStorage.getItem(storageKey));
    alert('Verifique o console do navegador (F12) para informações de debug');
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('decrementPriority').addEventListener('click', () => adjustPriority(-1));
  document.getElementById('incrementPriority').addEventListener('click', () => adjustPriority(1));
  elements.btnTheme.addEventListener('click', toggleTheme);
  document.getElementById('selectionPopup').addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', () => toggleSelectionPopup(false));

  setTheme();
  showView(state.currentUser ? 'board' : 'login');
}

function setTheme() {
  const isDark = localStorage.getItem('scrumway_theme') === 'dark';
  document.body.classList.toggle('dark', isDark);
  elements.btnTheme.textContent = isDark ? 'Tema claro' : 'Tema escuro';
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('scrumway_theme', isDark ? 'dark' : 'light');
  elements.btnTheme.textContent = isDark ? 'Tema claro' : 'Tema escuro';
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) return showFlash('Preencha usuário e senha.', 'danger');
  const user = state.users[username];
  if (!user) return showFlash('Usuário não encontrado.', 'danger');
  if (user.password !== password) return showFlash('Senha incorreta.', 'danger');
  state.currentUser = username;
  saveState();
  showFlash('Login efetuado com sucesso!', 'success');
  resetForms();
  showView('board');
}

function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const confirm = document.getElementById('registerConfirmPassword').value;
  if (!username || !email || !password || !confirm) return showFlash('Preencha todos os campos.', 'danger');
  if (password !== confirm) return showFlash('As senhas devem ser iguais.', 'danger');
  if (state.users[username]) return showFlash('Esse usuário já existe.', 'danger');
  if (Object.values(state.users).some(u => u.email === email)) return showFlash('Esse email já está cadastrado.', 'danger');
  state.users[username] = { email, password };
  state.notes[username] = '';
  state.teamMembers[username] = [];
  saveState();
  showFlash('Cadastro concluído com sucesso! Faça login.', 'success');
  showView('login');
}

function handleForgot(event) {
  event.preventDefault();
  const username = document.getElementById('forgotUsername').value.trim();
  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  const user = state.users[username];
  if (!user || user.email !== email) return showFlash('Usuário ou email não encontrado.', 'danger');
  state.recoveryUser = username;
  saveState();
  showFlash('Usuário verificado. Defina a nova senha.', 'info');
  showView('reset');
}

function handleReset(event) {
  event.preventDefault();
  if (!state.recoveryUser) return showFlash('Inicie a recuperação de senha primeiro.', 'danger');
  const password = document.getElementById('resetPassword').value;
  const confirm = document.getElementById('resetConfirmPassword').value;
  if (!password || !confirm) return showFlash('Preencha todos os campos.', 'danger');
  if (password !== confirm) return showFlash('As senhas devem ser iguais.', 'danger');
  state.users[state.recoveryUser].password = password;
  state.recoveryUser = null;
  saveState();
  showFlash('Senha redefinida com sucesso! Faça login.', 'success');
  showView('login');
}

function handleCreateTask(event) {
  event.preventDefault();
  const title = document.getElementById('newTaskTitle').value.trim() || 'Nova Tarefa';
  const description = document.getElementById('newTaskDescription').value.trim();
  state.tasks.push({
    id: crypto.randomUUID(),
    owner: state.currentUser,
    title,
    description,
    priority: '0',
    assignee: 'Não atribuído',
    column: 'stories',
    createdAt: new Date().toISOString()
  });
  saveState();
  showFlash('Tarefa criada com sucesso.', 'success');
  event.target.reset();
  renderBoard();
}

function handleAddMember(event) {
  event.preventDefault();
  const name = document.getElementById('newMemberName').value.trim();
  if (!name) return showFlash('Informe o nome do membro.', 'danger');
  const members = state.teamMembers[state.currentUser] || [];
  if (members.some(member => member.name === name)) return showFlash('Esse membro já está cadastrado.', 'danger');
  const colors = ['#f97316','#0ea5e9','#9333ea','#22c55e','#e11d48','#facc15','#14b8f6','#14b8a6','#8b5cf6','#fb7185','#38bdf8'];
  const available = colors.filter(color => !members.some(member => member.color === color));
  members.push({ name, color: available[0] || colors[0] });
  state.teamMembers[state.currentUser] = members;
  saveState();
  showFlash('Membro adicionado com sucesso.', 'success');
  event.target.reset();
  renderBoard();
}

function handleSaveNotes(event) {
  event.preventDefault();
  state.notes[state.currentUser] = elements.notesText.value.trim();
  saveState();
  showFlash('Observações salvas.', 'success');
}

function logout() {
  state.currentUser = null;
  saveState();
  showView('login');
}

function showView(view) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`${view}Section`).classList.remove('hidden');
  clearFlash();
  if (view === 'board') renderBoard();
}

function showFlash(message, type = 'info') {
  elements.flashContainer.innerHTML = `<div class="alert alert-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'info'} flash" role="alert">${message}</div>`;
}

function clearFlash() { elements.flashContainer.innerHTML = ''; }

function resetForms() { document.querySelectorAll('form').forEach(form => form.reset()); }

function getCurrentTasks() { return state.tasks.filter(task => task.owner === state.currentUser); }

function getTeamMembers() { return state.teamMembers[state.currentUser] || []; }

function renderBoard() {
  if (!state.currentUser) return;
  elements.boardUsername.textContent = state.currentUser;
  elements.notesText.value = state.notes[state.currentUser] || '';

  const members = getTeamMembers();
  elements.membersList.innerHTML = members.length
    ? members.map(member => `<span class="team-member-badge" style="background:${member.color};">${member.name}<button class="btn-close btn-close-white ms-2" type="button" data-member="${member.name}" aria-label="Remover"></button></span>`).join('')
    : '<p class="text-muted small">Ainda não há membros cadastrados.</p>';
  elements.membersList.querySelectorAll('.btn-close').forEach(button => button.addEventListener('click', () => deleteMember(button.dataset.member)));

  const tasks = getCurrentTasks();
  columns.forEach(column => {
    const container = getColumnContainer(column);
    const filtered = tasks.filter(task => task.column === column);
    if (container) {
      container.innerHTML = filtered.map(taskCard).join('') || '<div class="text-muted small">Nenhuma tarefa.</div>';
    }
    if (elements.counts[column]) {
      elements.counts[column].textContent = filtered.length;
    }
  });
  enableDragAndDrop();
}

function taskCard(task) {
  const assignee = task.assignee || 'Não atribuído';
  const member = getTeamMembers().find(member => member.name === assignee);
  const memberColor = member?.color || '#6c757d';
  const priority = Number(task.priority) || 0;
  return `
    <div class="card task-card mb-3 p-3 shadow-sm" draggable="true" data-task-id="${task.id}">
      <div class="d-flex justify-content-between align-items-start mb-2">
        <div class="d-flex flex-column">
          <strong>${escapeHtml(task.title)}</strong>
          <div class="d-flex gap-2 mt-2 align-items-center">
            <span class="badge badge-clickable p-2" style="background-color:${memberColor};color:#fff;font-size:11px;font-weight:500;" data-action="assignee" data-id="${task.id}">👤 ${escapeHtml(assignee)}</span>
            <span class="badge badge-clickable p-2" style="background-color:#fde047;color:#000;font-size:11px;font-weight:700;border:1px solid #ccc;" data-action="priority" data-id="${task.id}">${priority}</span>
          </div>
        </div>
      </div>
      <p class="mb-2 small">${escapeHtml(task.description || 'Sem descrição')}</p>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <button class="btn btn-sm btn-outline-primary" data-edit-id="${task.id}">Editar</button>
        <button class="btn btn-sm btn-outline-danger" data-delete-id="${task.id}">Excluir</button>
      </div>
    </div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[tag]));
}

function getColumnContainer(column) {
  const columnIdMap = {
    inprogress: 'InProgress'
  };
  return document.getElementById('column' + (columnIdMap[column] || capitalize(column)));
}

function enableDragAndDrop() {
  document.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });

  document.querySelectorAll('.task-list').forEach(list => {
    list.addEventListener('dragover', event => { event.preventDefault(); list.classList.add('drag-over'); });
    list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
    list.addEventListener('drop', event => {
      event.preventDefault();
      list.classList.remove('drag-over');
      const taskId = event.dataTransfer.getData('text/plain');
      if (taskId) moveTask(taskId, list.dataset.column);
    });
  });

  document.querySelectorAll('[data-edit-id]').forEach(button => button.addEventListener('click', () => openEditModal(button.dataset.editId)));
  document.querySelectorAll('[data-delete-id]').forEach(button => button.addEventListener('click', () => deleteTask(button.dataset.deleteId)));
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', event => handleQuickAction(event.currentTarget.dataset.action, event.currentTarget.dataset.id)));
}

function deleteMember(name) {
  state.teamMembers[state.currentUser] = getTeamMembers().filter(member => member.name !== name);
  saveState();
  renderBoard();
  showFlash('Membro removido.', 'info');
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(task => task.id !== taskId);
  saveState();
  renderBoard();
  showFlash('Tarefa excluída com sucesso.', 'success');
}

function moveTask(taskId, targetColumn) {
  const task = state.tasks.find(task => task.id === taskId && task.owner === state.currentUser);
  if (!task) return;
  task.column = targetColumn;
  saveState();
  renderBoard();
  showFlash('Tarefa movida com sucesso.', 'success');
}

function handleQuickAction(action, taskId) {
  if (action === 'assignee') showSelection(taskId, 'assignee');
  if (action === 'priority') showSelection(taskId, 'priority');
}

function showSelection(taskId, field) {
  const popup = document.getElementById('selectionPopup');
  popup.innerHTML = '';
  const task = state.tasks.find(task => task.id === taskId && task.owner === state.currentUser);
  if (!task) return;

  const members = getTeamMembers();
  const options = field === 'assignee'
    ? [{ label: 'Não atribuído', value: '' }, ...members.map(member => ({ label: member.name, value: member.name, color: member.color }))]
    : Array.from(new Set(fibonacci)).map(value => ({ label: String(value), value: String(value) }));

  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'd-flex align-items-center';
    button.innerHTML = option.color
      ? `<span style="width: 14px; height: 14px; border-radius: 4px; background:${option.color}; display:inline-block;"></span><span class="option-label">${escapeHtml(option.label)}</span>`
      : `<span class="option-label">${escapeHtml(option.label)}</span>`;
    button.addEventListener('click', () => {
      popup.classList.remove('visible');
      if (field === 'assignee') task.assignee = option.value || 'Não atribuído';
      else task.priority = option.value;
      saveState();
      renderBoard();
    });
    popup.appendChild(button);
  });

  const card = document.querySelector(`[data-task-id="${taskId}"] .badge-clickable[data-action="${field}"]`);
  if (!card) return;
  const rect = card.getBoundingClientRect();
  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY + 8}px`;
  popup.classList.add('visible');
}

function toggleSelectionPopup(show) {
  const popup = document.getElementById('selectionPopup');
  popup.classList.toggle('visible', show);
}

function openEditModal(taskId) {
  const task = state.tasks.find(task => task.id === taskId && task.owner === state.currentUser);
  if (!task) return;
  document.getElementById('editTaskId').value = task.id;
  document.getElementById('editTaskTitle').value = task.title;
  document.getElementById('editTaskDescription').value = task.description;
  document.getElementById('editTaskPriority').value = task.priority;
  document.getElementById('editTaskAssignee').innerHTML = `<option value="">Não atribuído</option>${getTeamMembers().map(member => `<option value="${member.name}">${member.name}</option>`).join('')}`;
  document.getElementById('editTaskAssignee').value = task.assignee === 'Não atribuído' ? '' : task.assignee;
  document.getElementById('editTaskColumn').value = task.column;
  document.getElementById('editTaskPriority').dataset.index = Math.max(0, getFibonacciIndex(Number(task.priority), 0));
  editModal.show();
}

function getFibonacciIndex(value, direction) {
  const unique = fibonacci.filter((v, index) => fibonacci.indexOf(v) === index);
  const index = unique.indexOf(value);
  if (index >= 0) return index;
  if (direction > 0) return unique.length - 1;
  if (direction < 0) return 0;
  return 0;
}

function adjustPriority(direction) {
  const input = document.getElementById('editTaskPriority');
  const current = Number(input.value) || 0;
  const unique = fibonacci.filter((v, index) => fibonacci.indexOf(v) === index);
  let index = unique.indexOf(current);
  if (index < 0) index = 0;
  const next = Math.max(0, Math.min(unique.length - 1, index + direction));
  input.value = unique[next];
}

document.getElementById('editTaskForm').addEventListener('submit', event => {
  event.preventDefault();
  const taskId = document.getElementById('editTaskId').value;
  const task = state.tasks.find(task => task.id === taskId && task.owner === state.currentUser);
  if (!task) return;
  task.title = document.getElementById('editTaskTitle').value.trim();
  task.description = document.getElementById('editTaskDescription').value.trim();
  task.priority = document.getElementById('editTaskPriority').value;
  const assignee = document.getElementById('editTaskAssignee').value;
  task.assignee = assignee || 'Não atribuído';
  task.column = document.getElementById('editTaskColumn').value;
  saveState();
  renderBoard();
  editModal.hide();
  showFlash('Tarefa atualizada com sucesso.', 'success');
});

function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

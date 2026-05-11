import os
from flask import Flask, render_template, request, redirect, url_for, flash, session
from data.data_manager import DataManager

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'troca_esta_chave_123')
manager = DataManager()

# Registrar função global para templates Jinja2
app.jinja_env.globals['get_member_color'] = lambda team_members, member_name: get_member_color(team_members, member_name)

COLUMNS = [
    ('stories', 'STORIES'),
    ('todo', 'A FAZER'),
    ('inprogress', 'EM PROCESSO'),
    ('done', 'REALIZADAS')
]

def fibonacci_infinito():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


def fibonacci_sequence(length=15):
    generator = fibonacci_infinito()
    return [next(generator) for _ in range(length)]


FIBONACCI_SEQUENCE = fibonacci_sequence()


def normalize_priority_value(value):
    if isinstance(value, str):
        value = value.strip()
        if value in ('Baixa', 'Média', 'Alta'):
            return {'Baixa': '1', 'Média': '2', 'Alta': '3'}[value]
        if value.isdigit():
            return str(int(value))
    try:
        return str(int(float(value)))
    except Exception:
        return '0'


def get_member_color(team_members, member_name):
    """Busca a cor de um membro pelo nome"""
    for member in team_members:
        if member.get('name') == member_name:
            return member.get('color', '#6c757d')
    return '#6c757d'


def load_data():
    manager.load_data()
    return manager


def current_user():
    return session.get('username')


def get_theme():
    return session.get('theme', 'light')


@app.before_request
def ensure_theme():
    if 'theme' not in session:
        session['theme'] = 'light'


def login_required():
    return 'username' in session


@app.route('/')
def index():
    if login_required():
        return redirect(url_for('board'))
    return redirect(url_for('login'))


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        manager = load_data()

        if manager.verify_user(username, password):
            session['username'] = username
            flash('Login efetuado com sucesso!', 'success')
            return redirect(url_for('board'))

        flash('Usuário ou senha incorretos.', 'danger')

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        manager = load_data()

        if not username or not email or not password or not confirm_password:
            flash('Preencha todos os campos.', 'danger')
        elif password != confirm_password:
            flash('As senhas devem ser iguais.', 'danger')
        else:
            try:
                manager.add_user(username, email, password)
                flash('Cadastro concluído com sucesso! Faça login.', 'success')
                return redirect(url_for('login'))
            except ValueError as error:
                flash(str(error), 'danger')

    return render_template('register.html')


@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip().lower()
        manager = load_data()

        if manager.find_user_by_email(username, email):
            session['recover_username'] = username
            flash('Usuário verificado. Defina a nova senha.', 'info')
            return redirect(url_for('reset_password'))

        flash('Usuário ou email não encontrado.', 'danger')

    return render_template('forgot_password.html')


@app.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    username = session.get('recover_username')
    if not username:
        flash('Inicie a recuperação de senha primeiro.', 'danger')
        return redirect(url_for('forgot_password'))

    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        manager = load_data()

        if not password or not confirm_password:
            flash('Preencha todos os campos.', 'danger')
        elif password != confirm_password:
            flash('As senhas devem ser iguais.', 'danger')
        else:
            manager.update_password(username, password)
            session.pop('recover_username', None)
            flash('Senha redefinida com sucesso! Faça login.', 'success')
            return redirect(url_for('login'))

    return render_template('reset_password.html', username=username)


@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('Sessão finalizada.', 'info')
    return redirect(url_for('login'))


@app.route('/toggle-theme')
def toggle_theme():
    session['theme'] = 'dark' if get_theme() == 'light' else 'light'
    return redirect(request.referrer or url_for('board'))


@app.route('/board')
def board():
    if not login_required():
        return redirect(url_for('login'))

    manager = load_data()
    username = current_user()
    tasks_by_column = {
        key: manager.get_tasks_by_column(username, key)
        for key, _ in COLUMNS
    }
    notes = manager.get_notes(username)
    team_members = manager.get_team_members(username)
    return render_template(
        'board.html',
        username=username,
        columns=COLUMNS,
        tasks_by_column=tasks_by_column,
        notes=notes,
        team_members=team_members,
        theme=get_theme(),
        fibonacci_sequence=FIBONACCI_SEQUENCE
    )


@app.route('/team-member/add', methods=['POST'])
def add_team_member():
    if not login_required():
        return redirect(url_for('login'))
    manager = load_data()
    username = current_user()
    member_name = request.form.get('member_name', '').strip()
    try:
        manager.add_team_member(username, member_name)
        flash('Membro adicionado com sucesso.', 'success')
    except ValueError as error:
        flash(str(error), 'danger')
    return redirect(url_for('board'))


@app.route('/team-member/delete', methods=['POST'])
def delete_team_member():
    if not login_required():
        return redirect(url_for('login'))
    manager = load_data()
    username = current_user()
    member_name = request.form.get('member_name', '').strip()
    manager.delete_team_member(username, member_name)
    flash('Membro removido.', 'info')
    return redirect(url_for('board'))


@app.route('/task/add', methods=['POST'])
def add_task():
    if not login_required():
        return redirect(url_for('login'))

    manager = load_data()
    username = current_user()
    task = {
        'title': request.form.get('title', '').strip() or 'Nova Tarefa',
        'description': request.form.get('description', '').strip(),
        'priority': '0',
        'assignee': 'Não atribuído',
        'column': 'stories'
    }
    manager.add_task(username, task)
    flash('Tarefa criada com sucesso.', 'success')
    return redirect(url_for('board'))


@app.route('/task/<task_id>/quick-update', methods=['POST'])
def quick_update_task(task_id):
    if not login_required():
        return redirect(url_for('login'))

    manager = load_data()
    username = current_user()
    task = manager.get_task_by_id(username, task_id)
    if not task:
        return ('Tarefa não encontrada.', 404)

    field = request.form.get('field', '').strip()
    value = request.form.get('value', '').strip()

    if field == 'assignee':
        task['assignee'] = value or 'Não atribuído'
    elif field == 'priority':
        task['priority'] = normalize_priority_value(value)
    else:
        return ('Campo inválido.', 400)

    manager.update_task(username, task)
    return ('', 204)


@app.route('/task/<task_id>/edit', methods=['GET', 'POST'])
def edit_task(task_id):
    if not login_required():
        return redirect(url_for('login'))

    manager = load_data()
    username = current_user()
    task = manager.get_task_by_id(username, task_id)
    if not task:
        flash('Tarefa não encontrada.', 'danger')
        return redirect(url_for('board'))

    if request.method == 'POST':
        task['title'] = request.form.get('title', '').strip()
        task['description'] = request.form.get('description', '').strip()
        task['priority'] = normalize_priority_value(request.form.get('priority', '0'))
        task['assignee'] = request.form.get('assignee', 'Não atribuído').strip()
        task['column'] = request.form.get('column', task['column'])
        manager.update_task(username, task)
        flash('Tarefa atualizada com sucesso.', 'success')
        return redirect(url_for('board'))

    task['priority_form'] = normalize_priority_value(task.get('priority', '0'))
    try:
        task['priority_index'] = FIBONACCI_SEQUENCE.index(int(task['priority_form']))
    except ValueError:
        task['priority_index'] = 0
    team_members = manager.get_team_members(username)
    return render_template('edit_task.html', task=task, columns=COLUMNS, fibonacci_sequence=FIBONACCI_SEQUENCE, team_members=team_members)


@app.route('/task/<task_id>/delete', methods=['POST'])
def delete_task(task_id):
    if not login_required():
        return redirect(url_for('login'))

    manager = load_data()
    username = current_user()
    manager.delete_task(username, task_id)
    flash('Tarefa excluída com sucesso.', 'success')
    return redirect(url_for('board'))


@app.route('/task/<task_id>/move', methods=['POST'])
def move_task(task_id):
    if not login_required():
        return redirect(url_for('login'))

    target_column = request.form.get('target_column')
    manager = load_data()
    username = current_user()
    task = manager.get_task_by_id(username, task_id)
    if task and target_column:
        task['column'] = target_column
        manager.update_task(username, task)
        flash('Tarefa movida com sucesso.', 'success')
    return redirect(url_for('board'))


@app.route('/notes', methods=['POST'])
def save_notes():
    if not login_required():
        return redirect(url_for('login'))

    manager = load_data()
    username = current_user()
    notes = request.form.get('notes', '').strip()
    manager.save_notes(username, notes)
    flash('Observações salvas.', 'success')
    return redirect(url_for('board'))


if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)

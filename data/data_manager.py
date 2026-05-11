"""
Data Manager
Gerenciador de dados para persistência em JSON
"""

import json
import os
import uuid
import hashlib
import hmac
import random
from datetime import datetime
from typing import Dict, List, Optional


class DataManager:
    """Classe para gerenciar dados da aplicação"""

    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, "users.json")
        self.tasks_file = os.path.join(data_dir, "tasks.json")
        self.notes_file = os.path.join(data_dir, "notes.json")
        self.sprints_file = os.path.join(data_dir, "sprints.json")
        self.team_members_file = os.path.join(data_dir, "team_members.json")

        os.makedirs(data_dir, exist_ok=True)

        self.current_user: Optional[str] = None
        self.users: Dict[str, Dict] = {}
        self.tasks: List[Dict] = []
        self.notes: Dict[str, str] = {}
        self.sprints: Dict[str, Dict] = {}
        self.team_members: Dict[str, List[Dict]] = {}

        self.load_data()

    def load_data(self):
        self.load_users()
        self.load_tasks()
        self.load_notes()
        self.load_sprints()
        self.load_team_members()

    def save_data(self):
        self.save_users()
        self.save_tasks()
        self.save_notes()
        self.save_sprints()
        self.save_team_members()

    def load_users(self):
        if os.path.exists(self.users_file):
            with open(self.users_file, 'r', encoding='utf-8') as f:
                self.users = json.load(f)
            for username, user_data in list(self.users.items()):
                if 'password_hash' in user_data and 'password' not in user_data:
                    self.users[username]['password'] = user_data['password_hash']
                    del self.users[username]['password_hash']
            self.save_users()
        else:
            self.users = {}
            self.add_user('admin', 'admin@example.com', '123456')

    def save_users(self):
        with open(self.users_file, 'w', encoding='utf-8') as f:
            json.dump(self.users, f, indent=2, ensure_ascii=False)

    def hash_password(self, password: str) -> str:
        salt = os.urandom(16)
        digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 120000)
        return f"pbkdf2_sha256$120000${salt.hex()}${digest.hex()}"

    def verify_password(self, hashed_password: str, password: str) -> bool:
        try:
            parts = hashed_password.split('$')
            if parts[0].startswith('pbkdf2_sha256') and len(parts) == 4:
                _, iterations, salt_hex, digest_hex = parts
                salt = bytes.fromhex(salt_hex)
                digest = bytes.fromhex(digest_hex)
                test = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(iterations))
                return hmac.compare_digest(test, digest)
            if parts[0].startswith('scrypt') and len(parts) == 3:
                import base64
                algorithm = parts[0]
                salt_part = parts[1]
                digest_hex = parts[2]
                fields = algorithm.split(':')
                if len(fields) != 4:
                    return False
                _, n, r, p = fields
                salt_part = salt_part + '=' * (-len(salt_part) % 4)
                salt = base64.b64decode(salt_part)
                digest = bytes.fromhex(digest_hex)
                test = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=int(n), r=int(r), p=int(p), dklen=len(digest))
                return hmac.compare_digest(test, digest)
            return False
        except Exception:
            return False

    def set_current_user(self, username: Optional[str]):
        self.current_user = username

    def add_user(self, username: str, email: str, password: str):
        if username in self.users:
            raise ValueError("Esse usuário já existe.")
        if any(u.get('email') == email for u in self.users.values()):
            raise ValueError("Esse email já está cadastrado.")
        self.users[username] = {
            'password': self.hash_password(password),
            'email': email
        }
        self.save_users()

    def verify_user(self, username: str, password: str) -> bool:
        user = self.users.get(username)
        if not user:
            return False
        hashed_password = user.get('password') or user.get('password_hash')
        if not hashed_password:
            return False
        return self.verify_password(hashed_password, password)

    def update_password(self, username: str, password: str):
        if username not in self.users:
            raise ValueError('Usuário não encontrado.')
        self.users[username]['password'] = self.hash_password(password)
        self.save_users()

    def find_user_by_email(self, username: str, email: str) -> bool:
        user = self.users.get(username)
        return user is not None and user.get('email') == email

    def load_tasks(self):
        if os.path.exists(self.tasks_file):
            with open(self.tasks_file, 'r', encoding='utf-8') as f:
                self.tasks = json.load(f)
        else:
            self.tasks = []

    def save_tasks(self):
        with open(self.tasks_file, 'w', encoding='utf-8') as f:
            json.dump(self.tasks, f, indent=2, ensure_ascii=False)

    def load_notes(self):
        if os.path.exists(self.notes_file):
            with open(self.notes_file, 'r', encoding='utf-8') as f:
                self.notes = json.load(f)
        else:
            self.notes = {}

    def save_notes(self, username: str, notes: str):
        self.notes[username] = notes
        with open(self.notes_file, 'w', encoding='utf-8') as f:
            json.dump(self.notes, f, indent=2, ensure_ascii=False)

    def load_sprints(self):
        if os.path.exists(self.sprints_file):
            with open(self.sprints_file, 'r', encoding='utf-8') as f:
                self.sprints = json.load(f)
        else:
            self.sprints = {}

    def save_sprints(self):
        with open(self.sprints_file, 'w', encoding='utf-8') as f:
            json.dump(self.sprints, f, indent=2, ensure_ascii=False)

    def load_team_members(self):
        if os.path.exists(self.team_members_file):
            with open(self.team_members_file, 'r', encoding='utf-8') as f:
                self.team_members = json.load(f)
        else:
            self.team_members = {}

    def save_team_members(self):
        with open(self.team_members_file, 'w', encoding='utf-8') as f:
            json.dump(self.team_members, f, indent=2, ensure_ascii=False)

    def get_team_members(self, owner: Optional[str]) -> List[Dict]:
        if owner is None:
            return []
        return self.team_members.get(owner, [])

    def add_team_member(self, owner: str, member_name: str):
        if not member_name or not member_name.strip():
            raise ValueError('Nome de membro inválido.')
        member_name = member_name.strip()
        members = self.team_members.setdefault(owner, [])
        available_colors = ['#f97316', '#0ea5e9', '#9333ea', '#22c55e', '#e11d48', '#facc15', '#14b8a6', '#8b5cf6', '#fb7185', '#38bdf8']
        if len(members) >= len(available_colors):
            raise ValueError(f'Máximo de {len(available_colors)} membros atingido.')
        if any(member.get('name') == member_name for member in members):
            raise ValueError('Esse membro já está cadastrado.')
        # Encontrar cores já usadas
        used_colors = {member.get('color') for member in members}
        # Encontrar cores disponíveis
        available = [color for color in available_colors if color not in used_colors]
        # Selecionar cor aleatória entre as disponíveis
        color = random.choice(available) if available else available_colors[0]
        members.append({'name': member_name, 'color': color})
        self.save_team_members()

    def delete_team_member(self, owner: str, member_name: str):
        members = self.team_members.get(owner, [])
        self.team_members[owner] = [member for member in members if member.get('name') != member_name]
        self.save_team_members()

    def add_task(self, owner: str, task_data: Dict):
        task_data['id'] = str(uuid.uuid4())
        task_data['owner'] = owner
        task_data['created_at'] = datetime.now().isoformat()
        task_data['updated_at'] = datetime.now().isoformat()
        self.tasks.append(task_data)
        self.save_tasks()

    def update_task(self, owner: str, task_data: Dict):
        task_id = task_data.get('id')
        if not task_id:
            return
        for index, task in enumerate(self.tasks):
            if task.get('id') == task_id and task.get('owner') == owner:
                task_data['owner'] = owner
                task_data['updated_at'] = datetime.now().isoformat()
                self.tasks[index] = task_data
                self.save_tasks()
                break

    def delete_task(self, owner: str, task_id: str):
        self.tasks = [task for task in self.tasks if not (task.get('id') == task_id and task.get('owner') == owner)]
        self.save_tasks()

    def get_tasks_by_column(self, owner: Optional[str], column: str) -> List[Dict]:
        if owner is None:
            return []
        return [task for task in self.tasks if task.get('owner') == owner and task.get('column') == column]

    def get_all_tasks(self, owner: Optional[str]) -> List[Dict]:
        return [task for task in self.tasks if task.get('owner') == owner]

    def get_task_by_id(self, owner: str, task_id: str) -> Optional[Dict]:
        for task in self.tasks:
            if task.get('id') == task_id and task.get('owner') == owner:
                return task.copy()
        return None

    def save_sprint_tasks(self, username: str, tasks: List[str], sprint_name: str):
        self.sprints.setdefault(username, {})
        self.sprints[username][sprint_name] = {
            'tasks': tasks,
            'updated_at': datetime.now().isoformat()
        }
        self.save_sprints()

    def get_sprint_tasks(self, username: str, sprint_name: str) -> List[str]:
        return self.sprints.get(username, {}).get(sprint_name, {}).get('tasks', [])

    def get_notes(self, username: str) -> str:
        return self.notes.get(username, "")

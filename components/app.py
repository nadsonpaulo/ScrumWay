"""
Scrum Application Main Class
Classe principal da aplicação Scrum Board com login e cadastro
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, simpledialog
from components.board import Board
from data.data_manager import DataManager


class ScrumApp:
    """Classe principal da aplicação Scrum Board"""

    def __init__(self):
        self.root = tk.Tk()
        self.root.title("QUADRO SCRUM")
        self.root.geometry("1300x850")
        self.root.minsize(1100, 700)

        self.data_manager = DataManager()
        self.current_user = None
        self.current_sprint = "Sprint 1"
        self.dark_mode = True

        self.setup_theme()
        self.create_frames()
        self.create_login_frame()
        self.create_register_frame()
        self.create_recover_frame()
        self.create_board_frame()

        self.show_frame(self.login_frame)

    def setup_theme(self):
        """Configura o tema da aplicação"""
        style = ttk.Style(self.root)

        if self.dark_mode:
            self.root.configure(bg='#1f1f2b')
            style.configure('TFrame', background='#1f1f2b')
            style.configure('TLabel', background='#1f1f2b', foreground='#f4f4f8')
            style.configure('TButton', background='#2f2f41', foreground='#f4f4f8')
            style.configure('TEntry', fieldbackground='#2f2f41', foreground='#f4f4f8')
            style.configure('TCombobox', fieldbackground='#2f2f41', foreground='#f4f4f8')
        else:
            self.root.configure(bg='#f4f5f7')
            style.configure('TFrame', background='#f4f5f7')
            style.configure('TLabel', background='#f4f5f7', foreground='#121212')
            style.configure('TButton', background='#e2e8f0', foreground='#121212')
            style.configure('TEntry', fieldbackground='#ffffff', foreground='#121212')
            style.configure('TCombobox', fieldbackground='#ffffff', foreground='#121212')

    def create_frames(self):
        """Cria os frames principais da aplicação"""
        self.container = ttk.Frame(self.root)
        self.container.pack(fill=tk.BOTH, expand=True)

        self.login_frame = ttk.Frame(self.container)
        self.register_frame = ttk.Frame(self.container)
        self.recover_frame = ttk.Frame(self.container)
        self.board_frame = ttk.Frame(self.container)

        for frame in (self.login_frame, self.register_frame, self.recover_frame, self.board_frame):
            frame.place(relx=0, rely=0, relwidth=1, relheight=1)

    def show_frame(self, frame):
        """Exibe o frame selecionado"""
        frame.lift()

    def create_login_frame(self):
        """Cria a tela de login"""
        card = ttk.Frame(self.login_frame, padding=30, style='Card.TFrame')
        card.place(relx=0.5, rely=0.5, anchor=tk.CENTER, width=520, height=460)

        ttk.Label(card, text="Login", font=('Arial', 24, 'bold')).pack(pady=(0, 20))

        ttk.Label(card, text="Usuário").pack(anchor=tk.W, pady=(5, 0))
        self.username_entry = ttk.Entry(card, width=40)
        self.username_entry.pack(pady=5)

        ttk.Label(card, text="Senha").pack(anchor=tk.W, pady=(10, 0))
        self.password_entry = ttk.Entry(card, width=40, show="*")
        self.password_entry.pack(pady=5)

        ttk.Button(card, text="Entrar", command=self.login_user).pack(pady=(20, 10), fill=tk.X)
        ttk.Button(card, text="Cadastrar novo usuário", command=lambda: self.show_frame(self.register_frame)).pack(fill=tk.X)
        ttk.Button(card, text="Recuperar senha", command=lambda: self.show_frame(self.recover_frame)).pack(pady=(10, 0), fill=tk.X)

        disclaimer = ttk.Label(card, text="Protegido por criptografia segura de senha.", font=('Arial', 9))
        disclaimer.pack(pady=(15, 0))

    def create_register_frame(self):
        """Cria a tela de cadastro"""
        card = ttk.Frame(self.register_frame, padding=30, style='Card.TFrame')
        card.place(relx=0.5, rely=0.5, anchor=tk.CENTER, width=560, height=520)

        ttk.Label(card, text="Cadastro", font=('Arial', 24, 'bold')).pack(pady=(0, 20))

        ttk.Label(card, text="Usuário").pack(anchor=tk.W, pady=(5, 0))
        self.reg_username = ttk.Entry(card, width=42)
        self.reg_username.pack(pady=5)

        ttk.Label(card, text="Email").pack(anchor=tk.W, pady=(10, 0))
        self.reg_email = ttk.Entry(card, width=42)
        self.reg_email.pack(pady=5)

        ttk.Label(card, text="Senha").pack(anchor=tk.W, pady=(10, 0))
        self.reg_password = ttk.Entry(card, width=42, show="*")
        self.reg_password.pack(pady=5)

        ttk.Label(card, text="Confirmar senha").pack(anchor=tk.W, pady=(10, 0))
        self.reg_confirm = ttk.Entry(card, width=42, show="*")
        self.reg_confirm.pack(pady=5)

        ttk.Button(card, text="Criar cadastro", command=self.register_user).pack(pady=(20, 10), fill=tk.X)
        ttk.Button(card, text="Voltar ao login", command=lambda: self.show_frame(self.login_frame)).pack(fill=tk.X)

    def create_recover_frame(self):
        """Cria a tela de recuperação de senha"""
        card = ttk.Frame(self.recover_frame, padding=30, style='Card.TFrame')
        card.place(relx=0.5, rely=0.5, anchor=tk.CENTER, width=560, height=420)

        ttk.Label(card, text="Recuperar Senha", font=('Arial', 24, 'bold')).pack(pady=(0, 20))

        ttk.Label(card, text="Usuário").pack(anchor=tk.W, pady=(5, 0))
        self.recover_username = ttk.Entry(card, width=42)
        self.recover_username.pack(pady=5)

        ttk.Label(card, text="Email cadastrado").pack(anchor=tk.W, pady=(10, 0))
        self.recover_email = ttk.Entry(card, width=42)
        self.recover_email.pack(pady=5)

        ttk.Button(card, text="Verificar", command=self.verify_recovery).pack(pady=(20, 10), fill=tk.X)
        ttk.Button(card, text="Voltar ao login", command=lambda: self.show_frame(self.login_frame)).pack(fill=tk.X)

    def create_board_frame(self):
        """Cria o quadro Scrum mas mantém escondido"""
        header = ttk.Frame(self.board_frame)
        header.pack(fill=tk.X, pady=(10, 0), padx=10)

        self.welcome_label = ttk.Label(header, text="", font=('Arial', 18, 'bold'))
        self.welcome_label.pack(side=tk.LEFT)

        ttk.Button(header, text="Sair", command=self.logout).pack(side=tk.RIGHT)

        self.content_frame = ttk.Frame(self.board_frame)
        self.content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.board_panel = ttk.Frame(self.content_frame)
        self.board_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.board = Board(self.board_panel, self.data_manager, self)
        self.board.pack(fill=tk.BOTH, expand=True)

        side_panel = ttk.Frame(self.content_frame, width=320)
        side_panel.pack(side=tk.RIGHT, fill=tk.Y, padx=(10, 0))
        side_panel.pack_propagate(False)

        self.setup_side_panel(side_panel)

        sprint_frame = ttk.Frame(self.board_frame, height=170)
        sprint_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        sprint_frame.pack_propagate(False)

        self.setup_sprint_panel(sprint_frame)

    def setup_side_panel(self, parent):
        ttk.Label(parent, text="Observações", font=('Arial', 12, 'bold')).pack(pady=(0, 8))
        self.notes_text = scrolledtext.ScrolledText(parent, wrap=tk.WORD, height=18)
        self.notes_text.pack(fill=tk.BOTH, expand=True)
        ttk.Button(parent, text="Salvar Notas", command=self.save_notes).pack(fill=tk.X, pady=(10, 5))
        ttk.Button(parent, text="Limpar", command=self.clear_notes).pack(fill=tk.X)

    def setup_sprint_panel(self, parent):
        header = ttk.Frame(parent)
        header.pack(fill=tk.X, pady=(0, 5))
        self.sprint_header_label = ttk.Label(header, text=f"SPRINT TASKS - {self.current_sprint}", font=('Arial', 12, 'bold'))
        self.sprint_header_label.pack(side=tk.LEFT)
        ttk.Button(header, text="Nova Sprint", command=self.create_sprint).pack(side=tk.RIGHT)

        self.sprint_tasks_list = tk.Listbox(parent, height=5)
        self.sprint_tasks_list.pack(fill=tk.BOTH, expand=True, pady=(0, 5))

        actions = ttk.Frame(parent)
        actions.pack(fill=tk.X)
        ttk.Button(actions, text="Adicionar Task", command=self.add_sprint_task).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5))
        ttk.Button(actions, text="Marcar Concluída", command=self.complete_sprint_task).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5))
        ttk.Button(actions, text="Remover", command=self.remove_sprint_task).pack(side=tk.LEFT, expand=True, fill=tk.X)

    def login_user(self):
        username = self.username_entry.get().strip()
        password = self.password_entry.get().strip()

        if not username or not password:
            messagebox.showwarning("Login", "Informe usuário e senha.")
            return

        if self.data_manager.verify_user(username, password):
            self.current_user = username
            self.data_manager.set_current_user(username)
            self.welcome_label.config(text=f"Bem-vindo(a), {username}")
            self.load_user_data()
            self.board.refresh_board()
            self.show_frame(self.board_frame)
        else:
            messagebox.showerror("Login", "Usuário ou senha incorretos.")

    def register_user(self):
        username = self.reg_username.get().strip()
        email = self.reg_email.get().strip()
        password = self.reg_password.get()
        confirm = self.reg_confirm.get()

        if not username or not email or not password or not confirm:
            messagebox.showwarning("Cadastro", "Preencha todos os campos.")
            return

        if password != confirm:
            messagebox.showwarning("Cadastro", "As senhas não conferem.")
            return

        try:
            self.data_manager.add_user(username, email, password)
            messagebox.showinfo("Cadastro", "Cadastro realizado com sucesso.")
            self.show_frame(self.login_frame)
        except ValueError as exc:
            messagebox.showerror("Cadastro", str(exc))

    def verify_recovery(self):
        username = self.recover_username.get().strip()
        email = self.recover_email.get().strip()

        if self.data_manager.find_user_by_email(username, email):
            self.open_password_reset(username)
        else:
            messagebox.showerror("Recuperação", "Usuário ou email não encontrado.")

    def open_password_reset(self, username):
        dialog = tk.Toplevel(self.root)
        dialog.title("Redefinir senha")
        dialog.geometry("420x220")
        dialog.transient(self.root)
        dialog.grab_set()

        ttk.Label(dialog, text=f"Redefinir senha de {username}", font=('Arial', 12, 'bold')).pack(pady=(20, 10))
        ttk.Label(dialog, text="Nova senha:").pack(anchor=tk.W, padx=20)
        password = ttk.Entry(dialog, show="*")
        password.pack(fill=tk.X, padx=20, pady=5)

        ttk.Label(dialog, text="Confirmar senha:").pack(anchor=tk.W, padx=20)
        confirm = ttk.Entry(dialog, show="*")
        confirm.pack(fill=tk.X, padx=20, pady=5)

        def reset_password():
            if not password.get() or not confirm.get():
                messagebox.showwarning("Recuperação", "Preencha os dois campos.")
                return
            if password.get() != confirm.get():
                messagebox.showwarning("Recuperação", "As senhas não conferem.")
                return
            self.data_manager.update_password(username, password.get())
            messagebox.showinfo("Recuperação", "Senha redefinida com sucesso.")
            dialog.destroy()
            self.show_frame(self.login_frame)

        ttk.Button(dialog, text="Salvar nova senha", command=reset_password).pack(pady=(15, 10))

    def logout(self):
        self.current_user = None
        self.data_manager.set_current_user(None)
        self.username_entry.delete(0, tk.END)
        self.password_entry.delete(0, tk.END)
        self.notes_text.delete(1.0, tk.END)
        self.sprint_tasks_list.delete(0, tk.END)
        self.show_frame(self.login_frame)

    def load_user_data(self):
        self.data_manager.load_data()
        self.notes_text.delete(1.0, tk.END)
        self.notes_text.insert(tk.END, self.data_manager.get_notes(self.current_user))
        self.sprint_tasks_list.delete(0, tk.END)
        self.sprint_header_label.config(text=f"SPRINT TASKS - {self.current_sprint}")
        for item in self.data_manager.get_sprint_tasks(self.current_user, self.current_sprint):
            self.sprint_tasks_list.insert(tk.END, item)

    def save_notes(self):
        if not self.current_user:
            return
        notes = self.notes_text.get(1.0, tk.END).strip()
        self.data_manager.save_notes(self.current_user, notes)

    def clear_notes(self):
        self.notes_text.delete(1.0, tk.END)

    def create_sprint(self):
        sprint_name = simpledialog.askstring("Nova Sprint", "Nome da nova sprint:")
        if sprint_name:
            self.current_sprint = sprint_name
            self.sprint_header_label.config(text=f"SPRINT TASKS - {self.current_sprint}")
            self.load_user_data()
            self.data_manager.save_sprints()

    def add_sprint_task(self):
        if not self.current_user:
            return
        task = simpledialog.askstring("Nova Task", "Descrição da task:")
        if task:
            self.sprint_tasks_list.insert(tk.END, f"[ ] {task}")
            self.data_manager.save_sprint_tasks(self.current_user, list(self.sprint_tasks_list.get(0, tk.END)), self.current_sprint)

    def complete_sprint_task(self):
        selection = self.sprint_tasks_list.curselection()
        if selection:
            index = selection[0]
            task = self.sprint_tasks_list.get(index)
            if task.startswith("[ ] "):
                self.sprint_tasks_list.delete(index)
                self.sprint_tasks_list.insert(index, f"[✓] {task[4:]}")
                self.data_manager.save_sprint_tasks(self.current_user, list(self.sprint_tasks_list.get(0, tk.END)), self.current_sprint)

    def remove_sprint_task(self):
        selection = self.sprint_tasks_list.curselection()
        if selection:
            self.sprint_tasks_list.delete(selection[0])
            self.data_manager.save_sprint_tasks(self.current_user, list(self.sprint_tasks_list.get(0, tk.END)), self.current_sprint)

    def save_data(self):
        self.data_manager.save_data()

    def run(self):
        self.root.mainloop()

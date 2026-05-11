"""
Column Component
Componente de coluna do quadro Scrum
"""

import tkinter as tk
from tkinter import ttk
from components.task_card import TaskCard


class Column(ttk.Frame):
    """Classe da coluna do quadro"""

    def __init__(self, parent, title, key, data_manager, board):
        super().__init__(parent, relief="raised", borderwidth=2)
        self.title = title
        self.key = key
        self.data_manager = data_manager
        self.board = board
        self.tasks = []
        self.dark_mode = True
        self.drag_data = {}

        self.setup_column()

    def setup_column(self):
        """Configura a coluna"""
        header_frame = ttk.Frame(self)
        header_frame.pack(fill=tk.X, padx=5, pady=5)

        self.title_label = ttk.Label(header_frame, text=self.title,
                                   font=('Arial', 12, 'bold'))
        self.title_label.pack(side=tk.LEFT)

        self.counter_label = ttk.Label(header_frame, text="(0)")
        self.counter_label.pack(side=tk.RIGHT)

        ttk.Button(header_frame, text="+", width=3,
                  command=self.create_task).pack(side=tk.RIGHT, padx=(5, 0))

        self.tasks_frame = ttk.Frame(self)
        self.tasks_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.canvas = tk.Canvas(self.tasks_frame, width=280, height=600, bg='#282a36', highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self.tasks_frame, orient="vertical", command=self.canvas.yview)
        self.scrollable_frame = ttk.Frame(self.canvas)

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")

        self.canvas.bind("<Enter>", lambda _: self.canvas.bind_all('<MouseWheel>', self._on_mousewheel))
        self.canvas.bind("<Leave>", lambda _: self.canvas.unbind_all('<MouseWheel>'))

        self.load_tasks()

    def create_task(self):
        task_data = {
            "title": "Nova Tarefa",
            "description": "Descrição da tarefa",
            "priority": "Média",
            "assignee": "Não atribuído",
            "column": self.key
        }
        self.edit_task_dialog(task_data, is_new=True)

    def edit_task_dialog(self, task_data, is_new=False):
        dialog = tk.Toplevel(self)
        dialog.title("Editar Tarefa" if not is_new else "Nova Tarefa")
        dialog.geometry("420x360")
        dialog.transient(self)
        dialog.grab_set()

        ttk.Label(dialog, text="Título:").grid(row=0, column=0, sticky="w", padx=10, pady=5)
        title_entry = ttk.Entry(dialog, width=40)
        title_entry.insert(0, task_data.get("title", ""))
        title_entry.grid(row=0, column=1, padx=10, pady=5)

        ttk.Label(dialog, text="Descrição:").grid(row=1, column=0, sticky="nw", padx=10, pady=5)
        desc_text = tk.Text(dialog, width=30, height=4)
        desc_text.insert(1.0, task_data.get("description", ""))
        desc_text.grid(row=1, column=1, padx=10, pady=5)

        ttk.Label(dialog, text="Prioridade:").grid(row=2, column=0, sticky="w", padx=10, pady=5)
        priority_combo = ttk.Combobox(dialog, values=["Baixa", "Média", "Alta"], state="readonly")
        priority_combo.set(task_data.get("priority", "Média"))
        priority_combo.grid(row=2, column=1, padx=10, pady=5)

        ttk.Label(dialog, text="Responsável:").grid(row=3, column=0, sticky="w", padx=10, pady=5)
        assignee_entry = ttk.Entry(dialog, width=40)
        assignee_entry.insert(0, task_data.get("assignee", ""))
        assignee_entry.grid(row=3, column=1, padx=10, pady=5)

        btn_frame = ttk.Frame(dialog)
        btn_frame.grid(row=4, column=0, columnspan=2, pady=20)

        def save():
            task_data["title"] = title_entry.get().strip()
            task_data["description"] = desc_text.get(1.0, tk.END).strip()
            task_data["priority"] = priority_combo.get()
            task_data["assignee"] = assignee_entry.get().strip()
            task_data["column"] = self.key

            if is_new:
                self.data_manager.add_task(self.board.app.current_user, task_data)
            else:
                self.data_manager.update_task(self.board.app.current_user, task_data)

            self.refresh_column()
            self.board.refresh_board()
            dialog.destroy()

        ttk.Button(btn_frame, text="Salvar", command=save).pack(side=tk.LEFT, padx=10)
        ttk.Button(btn_frame, text="Cancelar", command=dialog.destroy).pack(side=tk.LEFT)

    def load_tasks(self):
        self.tasks = self.data_manager.get_tasks_by_column(self.board.app.current_user, self.key)
        self.refresh_column()

    def refresh_column(self):
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()

        self.tasks = self.data_manager.get_tasks_by_column(self.board.app.current_user, self.key)
        self.counter_label.config(text=f"({len(self.tasks)})")

        for task in self.tasks:
            task_card = TaskCard(self.scrollable_frame, task, self)
            task_card.pack(fill=tk.X, pady=4)

    def update_theme(self, dark_mode):
        self.dark_mode = dark_mode

    def search_tasks(self, search_term):
        found = False
        for task in self.tasks:
            if (search_term in task.get("title", "").lower() or
                search_term in task.get("description", "").lower() or
                search_term in task.get("assignee", "").lower()):
                found = True
        return found

    def start_drag(self, event):
        widget = event.widget
        while widget and not isinstance(widget, TaskCard):
            widget = widget.master
        if widget and isinstance(widget, TaskCard):
            self.drag_data = {"card": widget}

    def drag(self, event):
        pass

    def drop(self, event):
        target_column = None
        for column in self.board.columns.values():
            if column != self and column.winfo_containing(event.x_root, event.y_root):
                target_column = column
                break

        if target_column and getattr(self, 'drag_data', None):
            task_card = self.drag_data.get("card")
            if task_card:
                task_data = task_card.task_data
                task_data["column"] = target_column.key
                self.data_manager.update_task(self.board.app.current_user, task_data)
                self.refresh_column()
                target_column.refresh_column()
                self.drag_data = {}

    def _on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

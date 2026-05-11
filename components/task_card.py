"""
Task Card Component
Componente do card de tarefa
"""

import tkinter as tk
from tkinter import ttk, messagebox


class TaskCard(ttk.Frame):
    """Classe do card de tarefa"""

    PRIORITY_COLORS = {
        "Baixa": "#28a745",
        "Média": "#ffc107",
        "Alta": "#dc3545"
    }

    def __init__(self, parent, task_data, column):
        super().__init__(parent, relief="raised", borderwidth=2)
        self.task_data = task_data
        self.column = column
        self.configure(padding=8)
        self.setup_card()

    def setup_card(self):
        priority = self.task_data.get("priority", "Média")
        color = self.PRIORITY_COLORS.get(priority, "#6c757d")

        header_frame = ttk.Frame(self)
        header_frame.pack(fill=tk.X)

        title_label = ttk.Label(header_frame, text=self.task_data.get("title", "Sem título"),
                               font=('Arial', 10, 'bold'))
        title_label.pack(side=tk.LEFT)

        priority_canvas = tk.Canvas(header_frame, width=12, height=12, bg=color, highlightthickness=0)
        priority_canvas.pack(side=tk.RIGHT, padx=(0, 4))

        content_frame = ttk.Frame(self)
        content_frame.pack(fill=tk.X, pady=(8, 4))

        desc_text = self.task_data.get("description", "")
        if len(desc_text) > 70:
            desc_text = desc_text[:67] + "..."

        desc_label = ttk.Label(content_frame, text=desc_text,
                              font=('Arial', 9), wraplength=240, justify=tk.LEFT)
        desc_label.pack(anchor=tk.W)

        footer_frame = ttk.Frame(self)
        footer_frame.pack(fill=tk.X)

        assignee = self.task_data.get("assignee", "Não atribuído")
        ttk.Label(footer_frame, text=f"👤 {assignee}", font=('Arial', 8)).pack(side=tk.LEFT)

        actions = ttk.Frame(footer_frame)
        actions.pack(side=tk.RIGHT)
        ttk.Button(actions, text="✏️", width=3, command=self.edit_task).pack(side=tk.LEFT, padx=1)
        ttk.Button(actions, text="🗑️", width=3, command=self.delete_task).pack(side=tk.LEFT, padx=1)

        self.bind_drag()

    def bind_drag(self):
        self.bind("<ButtonPress-1>", self.column.start_drag)
        self.bind("<B1-Motion>", self.column.drag)
        self.bind("<ButtonRelease-1>", self.column.drop)
        for child in self.winfo_children():
            child.bind("<ButtonPress-1>", self.column.start_drag)
            child.bind("<B1-Motion>", self.column.drag)
            child.bind("<ButtonRelease-1>", self.column.drop)

    def edit_task(self):
        self.column.edit_task_dialog(self.task_data)

    def delete_task(self):
        if messagebox.askyesno("Confirmar", "Deseja excluir esta tarefa?"):
            self.column.data_manager.delete_task(self.column.board.app.current_user, self.task_data.get("id"))
            self.column.refresh_column()

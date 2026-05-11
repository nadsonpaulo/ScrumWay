"""
Board Component
Componente do quadro Scrum
"""

import tkinter as tk
from tkinter import ttk, messagebox
from components.column import Column


class Board(ttk.Frame):
    """Classe do quadro Scrum"""

    def __init__(self, parent, data_manager, app):
        super().__init__(parent)
        self.data_manager = data_manager
        self.app = app
        self.columns = {}
        self.dark_mode = True

        self.setup_board()

    def setup_board(self):
        """Configura o quadro"""
        self.board_frame = ttk.Frame(self)
        self.board_frame.pack(fill=tk.BOTH, expand=True)

        self.canvas = tk.Canvas(self.board_frame, height=620, bg='#1f1f2b', highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self.board_frame, orient="horizontal", command=self.canvas.xview)
        self.scrollable_frame = ttk.Frame(self.canvas)

        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(xscrollcommand=self.scrollbar.set)

        self.canvas.pack(side="top", fill="both", expand=True)
        self.scrollbar.pack(side="bottom", fill="x")

        self.canvas.bind_all("<MouseWheel>", self._on_mousewheel)

        self.create_columns()

    def create_columns(self):
        """Cria as colunas do quadro"""
        column_data = [
            ("STORIES", "stories"),
            ("A FAZER", "todo"),
            ("EM PROCESSO", "inprogress"),
            ("REALIZADAS", "done")
        ]

        for title, key in column_data:
            column_frame = ttk.Frame(self.scrollable_frame)
            column_frame.pack(side=tk.LEFT, fill=tk.Y, padx=8, pady=8)

            self.columns[key] = Column(column_frame, title, key, self.data_manager, self)
            self.columns[key].pack(fill=tk.BOTH, expand=True)

    def create_task(self):
        if "stories" in self.columns:
            self.columns["stories"].create_task()

    def refresh_board(self):
        for column in self.columns.values():
            column.refresh_column()

    def update_theme(self, dark_mode):
        self.dark_mode = dark_mode
        for column in self.columns.values():
            column.update_theme(dark_mode)

    def search_tasks(self, search_term):
        found = False
        for column in self.columns.values():
            if column.search_tasks(search_term.lower()):
                found = True

        if not found:
            messagebox.showinfo("Busca", f"Nenhuma tarefa encontrada com: '{search_term}'")

    def _on_mousewheel(self, event):
        self.canvas.xview_scroll(int(-1 * (event.delta / 120)), "units")

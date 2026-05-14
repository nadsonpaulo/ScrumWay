# ScrumWay - Gestão Ágil Profissional (v2.1)

ScrumWay é uma aplicação de quadro SCRUM moderna, segura e escalável, projetada para equipes que buscam simplicidade com robustez.

## 🚀 Funcionalidades Principais

- **Arquitetura Organizada**: Backend e Frontend separados para melhor manutenção.
- **Autenticação Segura**: Utiliza **JWT (JSON Web Tokens)** para sessões seguras e expiráveis.
- **Banco de Dados Relacional**: Persistência de usuários e perfis via **SQLite**.
- **Gestão de Perfis**: Suporte a perfis **Team**, **PO**, **SM** e **Admin**.
- **Segurança Avançada**:
    - Senhas com Hashing seguro (PBKDF2).
    - Troca obrigatória de senha padrão.
    - Proteção contra ataques XSS e CSRF.
    - Variáveis de ambiente para segredos sensíveis.

---

## 📂 Estrutura do Projeto

```text
/scrumway
  ├── backend/           # Lógica do Servidor (Python/Flask)
  │   ├── app.py         # API principal
  │   └── models.py      # Modelagem do Banco de Dados
  ├── docs/              # Frontend (HTML, CSS, JS) - GitHub Pages
  ├── data/              # Dados Locais (Banco SQLite)
  ├── .env               # Configurações sensíveis (NÃO versionar)
  ├── requirements.txt   # Dependências Python
  └── README.md          # Documentação
```

---

## 🛠️ Configuração e Instalação

### 1. Preparar o Ambiente
```bash
git clone https://github.com/nadsonpaulo/ScrumWay.git
cd ScrumWay
pip install -r requirements.txt
```

### 2. Configurar Variáveis
Crie o arquivo `.env` na raiz:
```bash
AUTH_SECRET=seu_segredo_aleatorio_aqui
ADMIN_PASSWORD=admin
```

### 3. Iniciar o Sistema
Inicie o backend:
```bash
python backend/app.py
```
O servidor estará ativo em `http://localhost:5000`.

---

## 🔑 Acesso Administrativo

O usuário inicial é `admin` com a senha definida no seu `.env` (padrão `admin`). No primeiro login, o sistema exigirá a criação de uma senha forte de no mínimo 8 caracteres.

---

## 🌐 Deploy (Produção)

- **Frontend**: A pasta `docs/` está pronta para o **GitHub Pages**.
- **Backend**: O código é compatível com **Render**, **Railway** ou **PythonAnywhere**. 
    - Lembre-se de configurar as variáveis de ambiente `AUTH_SECRET` e `ADMIN_PASSWORD` no painel da sua hospedagem.

---

## 📄 Licença
Desenvolvido para gestão ágil e colaborativa.

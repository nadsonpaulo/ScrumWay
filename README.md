# ScrumWay - Gestão Ágil

ScrumWay é uma aplicação de quadro SCRUM moderna, agora com suporte a banco de dados, perfis de acesso (Team, PO, SM, Admin) e segurança robusta via JWT.

## 🚀 Novas Funcionalidades (v2.0)

- **Backend Flask**: API robusta para gerenciamento de usuários e autenticação.
- **Banco de Dados SQLite**: Armazenamento seguro de contas e perfis.
- **Segurança JWT**: Autenticação via tokens (JSON Web Tokens) com expiração.
- **Painel Administrativo**: Gestão de usuários, alteração de perfis e redefinição de senhas.
- **Troca de Senha Obrigatória**: Segurança reforçada para contas com senhas padrão.
- **Perfis de Acesso**: Suporte a perfis Team, Product Owner (PO) e Scrum Master (SM).
- **Criptografia Client-side**: Os dados do quadro permanecem privados e criptografados no navegador do usuário.

---

## 🛠️ Requisitos

- Python 3.8 ou superior
- Pip (Gerenciador de pacotes do Python)

---

## 📦 Instalação e Configuração

### 1. Clonar o Repositório
```bash
git clone https://github.com/nadsonpaulo/ScrumWay.git
cd ScrumWay
```

### 2. Instalar Dependências
```bash
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (use o `.env.example` como base):
```bash
AUTH_SECRET=seu_segredo_super_forte_aqui
ADMIN_PASSWORD=admin
```

---

## 🚦 Como Rodar

### Iniciar o Backend (Servidor API)
```bash
python app.py
```
O servidor rodará em `http://localhost:5000`.

### Acessar o Frontend
Abra o arquivo `docs/index.html` em qualquer navegador ou use um servidor estático:
```bash
cd docs
python -m http.server 8000
```
Acesse `http://localhost:8000`.

---

## 🔑 Acesso Inicial (Admin)

- **Usuário**: `admin`
- **Senha Padrão**: `admin` (será solicitada a troca obrigatória no primeiro login para 8+ caracteres).

---

## 📂 Estrutura do Projeto

- `backend/app.py`: Servidor Flask e rotas da API.
- `backend/models.py`: Modelagem do banco de dados SQLAlchemy.
- `requirements.txt`: Lista de dependências do projeto.
- `.env`: Configurações sensíveis (não versionado).
- `docs/`: Frontend da aplicação (HTML, CSS, JS).
- `data/scrumway.db`: Arquivo do banco de dados SQLite.

---

## 🛡️ Segurança

- Senhas são armazenadas no banco usando **Hashing Seguro** (PBKDF2).
- Sessões administrativas são protegidas por tokens **JWT**.
- O projeto ignora arquivos sensíveis no Git através do `.gitignore`.

---

## 📄 Licença
Este projeto é para fins educacionais e de gestão ágil.

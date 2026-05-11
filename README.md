# Scrum Board Application

Sistema completo de Quadro SCRUM em Python com interface web.

## Funcionalidades

- Tela de login com cadastro e recuperação de senha
- Senhas criptografadas em arquivo JSON
- Quadro SCRUM com colunas: STORIES, A FAZER, EM PROCESSO, REALIZADAS
- Criação, edição, exclusão e movimentação de tarefas
- Observações do usuário salvas por login
- Interface responsiva em navegador
- Persistência de dados em arquivos JSON locais

## Requisitos

- Python 3.11+
- Flask

> Em produção, configure `FLASK_SECRET_KEY` no ambiente em vez de usar a chave padrão.

## Estrutura do Projeto

```
Scrumway/
├── app.py
├── main.py
├── requirements.txt
├── README.md
├── templates/
│   ├── base.html
│   ├── board.html
│   ├── edit_task.html
│   ├── forgot_password.html
│   ├── login.html
│   ├── register.html
│   └── reset_password.html
├── components/  # usado apenas como código auxiliar antigo
├── data/
│   ├── data_manager.py
│   ├── notes.json
│   ├── tasks.json
│   ├── users.json
│   └── sprints.json
```
## Como Executar

1. Instale as dependências:

```bash
pip install -r requirements.txt
```

2. Abra o terminal em `C:\Users\Public\Documents\Docker\scrumway`
3. Execute:

```bash
python main.py
```

4. Abra o navegador em:

```text
http://127.0.0.1:5000
```

## Versão estática para GitHub Pages

Uma versão estática do ScrumWay foi adicionada em `docs/index.html`. Essa versão roda inteiramente no navegador e usa `localStorage` para salvar tarefas, membros e notas.

Para publicar no GitHub Pages:

1. Faça push do repositório para o GitHub.
2. Vá em `Settings` > `Pages` no GitHub.
3. Selecione a branch `main` (ou `master`) e a pasta `/docs`.
4. Aguarde o GitHub gerar a página.

> Observação: a versão estática salva dados apenas no navegador do usuário, e não compartilha entre diferentes computadores ou navegadores.

## Login

- Usuário inicial: `admin`
- Senha inicial: `123456`

## Resolução de problemas

- Se você estiver usando a versão estática (`docs/index.html`) e a credencial não funcionar, limpe o `localStorage` do navegador ou abra em modo anônimo para reiniciar o estado.
- Se você estiver usando o backend Flask e tiver um arquivo `data/users.json` existente, o usuário `admin` também deve aceitar `123456`. Se ainda não funcionar, apague `data/users.json` e reinicie o servidor para regenerar a conta padrão.

## Dados

- `data/users.json`: usuários e senhas criptografadas
- `data/tasks.json`: tarefas salvas
- `data/notes.json`: observações do usuário
- `data/sprints.json`: informações de sprint

# ScrumWay Web

Projeto convertido para uma aplicação web estática em **HTML/CSS/JavaScript** pronta para rodar no **GitHub Pages**.

## Versão recomendada

O aplicativo web estático está em `docs/index.html` e funciona totalmente no navegador usando `localStorage`.

### Recursos

- Login / cadastro / recuperação de senha
- Quadro SCRUM com colunas: STORIES, A FAZER, EM PROCESSO, REALIZADAS
- Criação, edição, exclusão e movimentação de tarefas
- Responsável e complexidade ajustáveis
- Notas por usuário
- Tema claro/escuro
- Dados salvos localmente no navegador via `localStorage`

## Como publicar no GitHub Pages

1. Faça push do repositório para o GitHub.
2. No repositório GitHub, abra `Settings` > `Pages`.
3. Selecione a branch `master` e a pasta `/docs`.
4. Salve e aguarde a publicação.

A página será servida a partir de `https://<seu-usuario>.github.io/<seu-repositorio>/`.

## Como testar localmente

A forma mais simples é abrir `docs/index.html` no navegador ou rodar um servidor local na pasta `docs`:

```bash
cd docs
python -m http.server 8000
```

Em seguida, acesse `http://localhost:8000`.

## Credenciais iniciais

- Usuário: `admin`
- Senha: `123456`

## Observações

- A versão atual é uma aplicação web estática que roda no navegador.
- Os dados do quadro são armazenados apenas no navegador atual via `localStorage`.
- Um arquivo de credenciais criptografado pode ser usado para armazenar usuário e senha sem um banco de dados.

## Armazenamento seguro de credenciais

O projeto agora inclui um sistema leve de credenciais criptografadas em `data/credentials.enc`.
A chave secreta não deve ser armazenada no repositório; use a variável de ambiente `AUTH_SECRET`.

Para iniciar o arquivo de credenciais:

```bash
copy .env.example .env
setx AUTH_SECRET "seu_segredo_forte_aqui"
python init_credentials.py
```

O arquivo criptografado será criado em `data/credentials.enc`.

Usuário padrão: `admin` / `123456`

## Estrutura atual do projeto

- `docs/index.html`
- `docs/app.js`
- `docs/style.css`
- `auth_storage.py`
- `init_credentials.py`
- `data/credentials.enc`
- `.env.example`
- `README.md`
- `package.json`
- `.gitignore`

## Como testar localmente

A forma mais simples é abrir `docs/index.html` no navegador ou rodar um servidor local na pasta `docs`:

```bash
cd docs
python -m http.server 8000
```

Em seguida, acesse `http://localhost:8000`.

## Verificação de estrutura

No diretório raiz do projeto, execute:

```bash
npm test
```

Isso valida se os arquivos principais estão presentes em `docs/`.

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

- A versão estática não depende de Python ou backend.
- Os dados são armazenados apenas no navegador atual.
- O backend Python/Flask existente permanece no repositório como versão antiga.

## Estrutura do projeto

```
ScrumWay/
├── docs/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── app.py
├── main.py
├── requirements.txt
├── README.md
├── templates/
├── components/
├── data/
└── ...
```

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

## Segurança

### Medidas implementadas
- **Sanitização XSS**: Todos os dados do usuário são sanitizados antes de serem inseridos no DOM
- **Validação de entrada**: Validação rigorosa de usernames, emails, senhas e outros campos
- **Proteção contra prototype pollution**: Sanitização de objetos JSON carregados
- **Limitação de tamanho**: Restrições de tamanho para prevenir ataques de denial of service
- **Sessão com timeout**: Sessões expiram após 24 horas de inatividade
- **Sem senhas padrão**: Não há credenciais padrão no código

### Recomendações
- Use HTTPS em produção
- Mantenha o navegador atualizado
- Não compartilhe dados sensíveis via localStorage em ambientes compartilhados
- Considere usar um backend seguro para produção

### Vulnerabilidades corrigidas
- XSS em mensagens de flash
- XSS em nomes de membros da equipe
- XSS em opções de edição de tarefas
- Prototype pollution no carregamento de estado
- Falta de validação de entrada
- Sessões infinitas

## Credenciais iniciais

Como não há mais usuário padrão, você deve se cadastrar primeiro.

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

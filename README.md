# Projeto Final - Engenheiro de Qualidade de Software | EBAC

Projeto de conclusão do curso **Profissão: Engenheiro de Qualidade de Software** da EBAC.

## Sobre o projeto

Automação de testes para a aplicação **EBAC-SHOP** (http://lojaebac.ebaconline.art.br), cobrindo as User Stories:

| US | Descrição | Tipo |
|----|-----------|------|
| US-0001 | Adicionar item ao carrinho | UI (E2E) |
| US-0002 | Login na plataforma | UI (E2E) |
| US-0003 | API de Cupons | API |

## Tecnologias

- [Cypress 13](https://www.cypress.io/) — testes E2E e API

## Como executar

### Pré-requisitos
- Node.js >= 18
- npm >= 9

### Instalação

```bash
npm install
npx cypress install
```

### Rodando os testes

```bash
# Interface gráfica (recomendado para ver os testes rodando)
npm run cypress:open

# Linha de comando - todos os testes
npm run cypress:run

# Por User Story
npm run test:carrinho
npm run test:login
npm run test:api
```

## Estrutura

```
cypress/
├── e2e/
│   ├── US001_carrinho.cy.js   # Testes do carrinho
│   ├── US002_login.cy.js      # Testes de login
│   └── US003_cupons_api.cy.js # Testes da API de cupons
├── fixtures/
│   └── dados.json             # Massa de dados
└── support/
    ├── commands.js            # Comandos customizados
    └── e2e.js                 # Configurações globais
```

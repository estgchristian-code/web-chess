# chess-web

Jogo de xadrez local para dois jogadores no mesmo dispositivo. Sem backend, sem
autenticação e sem conexão obrigatória: a partida é validada no navegador e
persistida localmente.

> **Estágio atual: fundação (v0.1).** A estrutura, o design system e a base de
> testes estão prontos. Tabuleiro, regras, relógio e persistência entram nas
> próximas etapas.

## Requisitos

- Node.js `^22.22.2 || >= 24.15.0` (recomendado: 24, ver `.nvmrc`)
- npm 11+

## Scripts

| Script                  | Descrição                                           |
| ----------------------- | --------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento (http://localhost:5173) |
| `npm run build`         | Typecheck (`tsc -b`) + build de produção            |
| `npm run preview`       | Pré-visualização do build                           |
| `npm run typecheck`     | Apenas verificação de tipos                         |
| `npm run lint`          | ESLint com zero warnings permitidos                 |
| `npm run lint:fix`      | ESLint com correção automática                      |
| `npm run format`        | Prettier em todo o projeto                          |
| `npm run format:check`  | Verifica formatação sem alterar arquivos            |
| `npm test`              | Vitest (execução única)                             |
| `npm run test:watch`    | Vitest em modo watch                                |
| `npm run test:coverage` | Vitest com relatório de cobertura                   |
| `npm run e2e`           | Playwright (requer `npx playwright install`)        |

## Stack

| Camada    | Tecnologia                              |
| --------- | --------------------------------------- |
| UI        | React 19 + TypeScript 6 (strict)        |
| Build     | Vite 8                                  |
| Regras    | chess.js 1.4 (próxima etapa)            |
| Tabuleiro | react-chessboard 5 (próxima etapa)      |
| Estado    | Zustand 5 (próxima etapa)               |
| Estilo    | Tailwind CSS 4 + tokens em CSS          |
| Validação | Zod 4 (persistência)                    |
| Testes    | Vitest 5 + Testing Library + Playwright |

## Estrutura

```
src/
├─ app/            # shell e telas
├─ components/     # ui, board, panels, dialogs, brand
├─ domain/         # tipos e regras do xadrez (sem React)
├─ store/          # estado global (Zustand)
├─ persistence/    # schema, adaptadores e migrações
├─ hooks/          # hooks reutilizáveis
├─ lib/            # utilitários puros
├─ styles/         # tokens e estilos globais
└─ test/           # setup e fixtures

e2e/               # testes Playwright
```

Regra de dependência: `components → store → domain`. O domínio não importa React
e a UI não importa `chess.js` diretamente.

## Pendências conhecidas

- Instalar os navegadores do Playwright: `npx playwright install chromium`.
- Implementar o núcleo de regras, relógio, persistência e tabuleiro (próximas etapas).

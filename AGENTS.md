<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:brotar -->

# Brotar

App de hábitos em pt-BR. UI, comentários e mensagens de erro são em português.

## Fronteira que importa

`src/server/services/` guarda a regra de negócio e **não pode importar nada do
Next** (nem `next/server`, nem `next/headers`). As rotas em `src/app/api/` são
cascas finas: autenticam, chamam um serviço, e passam o erro para
`toErrorResponse`. A ideia é poder mover `src/server/` para uma API Node
separada sem reescrever nada.

## Regras de domínio

- Uma marcação é um dia de calendário `YYYY-MM-DD` no fuso `APP_TIMEZONE`, nunca
  um timestamp. Use os helpers de `src/server/dates.ts` — não chame
  `toISOString().slice(0,10)` direto num `Date`.
- A linha em `HabitEntry` existindo já significa "feito". Não há coluna booleana.
- Sequência: o dia de hoje ainda vazio **não** quebra a contagem.
- Hábito removido é arquivado (`archivedAt`), nunca apagado.

## Autenticação

- Páginas e rotas usam `getCurrentUser()` / `requireUser()`
  (`src/server/auth/current-user.ts`), que confirmam a conta no banco. Não use o
  payload do JWT direto para escrever: o token sobrevive ao usuário.
- Ao detectar sessão sem conta, redirecione para `/sair`, não para `/entrar` —
  senão o proxy devolve a pessoa para dentro do app num laço.
- `src/proxy.ts` roda no edge: nada de Prisma nem `next/headers` ali.
- Nada de trabalho de banco no escopo de módulo. `next build` importa cada rota
  para coletar metadados, e um cliente criado na importação faz o build inteiro
  depender do banco estar acessível — foi assim que um deploy quebrou. O
  `prisma` exportado por `src/server/db.ts` é preguiçoso de propósito.

## Front

- Client components ressincronizam com props durante a renderização (padrão
  `syncedFrom` em `HabitList`), não em `useEffect` — o ESLint barra o efeito.
- Mensagens do mural nunca vão para `dangerouslySetInnerHTML`; `FeedList` as
  transforma em nós React.
- O CSS é global e vem do protótipo (`src/app/globals.css`), sem Tailwind nem
  CSS modules. Reaproveite as classes existentes antes de criar novas.

<!-- END:brotar -->

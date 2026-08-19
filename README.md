# Brotar

App de hábitos para quem está começando — ou começando de novo. Um jardim que
cresce com a sua constância, sequências que não punem o dia ainda em aberto, e
uma comunidade onde recomeçar é comemorado tanto quanto uma sequência longa.

Nasceu do protótipo `brotar_2.html` (uma página só, dados em memória). Aqui as
mesmas quatro telas rodam sobre banco de dados, contas e API de verdade.

## Rodando

```bash
npm install
```

```bash
cp .env.example .env
```

Gere um `AUTH_SECRET` e cole no `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Crie o banco e popule com dados de demonstração:

```bash
npm run db:migrate && npm run db:seed
```

```bash
npm run dev
```

Abra http://localhost:3000 e entre com **ana@brotar.app** / **brotar123** — ela
tem cerca de 150 dias de histórico, três hábitos e o dia de hoje em aberto. Os
outros usuários do seed (`marina@`, `joao@`, `bia@`, `rafael@`) usam a mesma senha.

## Scripts

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução em produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Cria/aplica migrações (Prisma) |
| `npm run db:seed` | Repopula o banco — **apaga tudo antes** |
| `npm run db:reset` | Recria o banco do zero e roda o seed |
| `npm run db:studio` | Prisma Studio para inspecionar os dados |

## Como o código está organizado

```
src/
  app/
    (auth)/            entrar, criar-conta
    (app)/             hoje, habitos, comunidade, perfil (exigem sessão)
    api/               route handlers — cascas finas sobre server/services
    sair/              limpa o cookie e volta para /entrar
  components/          UI; os client components cuidam de otimismo e erro
  lib/                 código que roda nos dois lados (DTOs, cliente HTTP, cores)
  server/
    auth/              JWT, cookie de sessão, usuário atual
    services/          regra de negócio — não conhece HTTP nem Next
    dates.ts           dias de calendário no fuso do app
    errors.ts          erros de domínio; a camada HTTP traduz em status
  proxy.ts             protege rotas antes de renderizar
prisma/                schema, migrações e seed
```

**A regra de negócio mora em `src/server/services/` e não importa nada do
Next.** As rotas em `src/app/api/` só autenticam, chamam o serviço e traduzem
erro em status. É essa fronteira que permite mover a API para um serviço Node
separado depois: leva-se `server/` para um Express/Fastify e aponta-se
`NEXT_PUBLIC_API_URL` (já lido em `src/lib/api.ts`) para ele, sem tocar na UI.

## Decisões que valem explicar

**Dias, não instantes.** Uma marcação é a data local (`YYYY-MM-DD`) resolvida no
fuso de `APP_TIMEZONE`, não um timestamp. Marcar às 23h no Brasil cai no dia de
hoje, e não no dia seguinte em UTC. A presença da linha em `HabitEntry` já
significa "feito" — desmarcar apaga a linha.

**Hoje em aberto não quebra sequência.** A sequência só é interrompida por um
dia já encerrado e vazio. Quem ainda não marcou nada de manhã não perde nada.

**O jardim compara com o que existia.** Cada dia é medido contra os hábitos que
já existiam naquela data — quem começou ontem não vê 182 dias de falha atrás de si.

**Hábito removido é arquivado.** `archivedAt` em vez de `DELETE`: se o hábito
voltar, o histórico continua valendo.

**Sessão própria, não Auth.js.** JWT assinado com `jose` num cookie httpOnly e
bcrypt para a senha (~80 linhas em `src/server/auth/`). Evita a instabilidade do
Auth.js v5 beta no Next 16; trocar depois é localizado.

**Sessão válida ≠ conta existente.** O proxy roda no edge e só valida a
assinatura do token. Toda leitura e escrita passa por `requireUser()`, que
confirma a conta no banco — e a rota `/sair` existe para apagar o cookie de uma
sessão órfã sem entrar em laço de redirect com o proxy.

**Mensagens do mural não viram HTML.** Elas contêm `<b>` e também nome de hábito
digitado por gente; `FeedList` quebra a string em nós React em vez de injetar
HTML, então o negrito funciona sem abrir espaço para injeção.

## De SQLite para Postgres

Troque `provider = "sqlite"` por `"postgresql"` em `prisma/schema.prisma`, ajuste
`DATABASE_URL`, troque o adapter em `src/server/db.ts` por `@prisma/adapter-pg`
e rode `npm run db:migrate`. Nenhum modelo precisa mudar.

## O que ainda não existe

Recuperação de senha, edição de hábito (só criar e arquivar), criação de grupos
pela interface (vêm do seed), paginação do mural e testes automatizados.

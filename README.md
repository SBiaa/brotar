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

No `.env`, preencha as duas conexões do Neon (console → seu projeto → **Connect**):

- `DATABASE_URL` — a string **com** `-pooler` no host. É a que o app usa a cada
  request; quem segura o número de conexões é o pooler do Neon.
- `DIRECT_URL` — a mesma string **sem** `-pooler`. Só a CLI do Prisma usa, para
  migrar: o pooler não mantém a sessão necessária para aplicar DDL.

Gere um `AUTH_SECRET` e cole no `.env` também:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Crie as tabelas e popule com dados de demonstração:

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

## Banco

Postgres no [Neon](https://neon.tech), via `@prisma/adapter-pg`. A url não fica
no `schema.prisma` — o Prisma 7 a lê de `prisma.config.ts`, que é onde a conexão
de migração (`DIRECT_URL`) é separada da conexão do app (`DATABASE_URL`).

Para trabalhar sem sujar os dados principais, crie um **branch** no Neon e aponte
o `.env` local para ele — o banco de produção fica intocado.

## Publicando

Configure três variáveis de ambiente no serviço (Vercel e afins):

- `DATABASE_URL` — a string pooled do Neon
- `AUTH_SECRET` — **um segredo diferente do local**; se vazar em um ambiente,
  o outro continua íntegro
- `APP_TIMEZONE` — `America/Sao_Paulo`

`DIRECT_URL` é opcional: sem ela, a conexão de migração é derivada da pooled.

O `vercel.json` fixa as funções em `gru1` (São Paulo) para ficarem no mesmo
continente que o banco no Neon (`sa-east-1`) — a região padrão da Vercel é nos
Estados Unidos, e cada query pagaria a travessia.

O `postinstall` roda `prisma generate` sozinho. **O build não toca no banco** —
nem para migrar, nem para instanciar o cliente, que só nasce no primeiro acesso
em tempo de execução. Assim um problema de conexão nunca derruba um deploy.

Migração nova você aplica deliberadamente, antes de subir o código que depende
dela:

```bash
npm run db:deploy
```

## O que ainda não existe

Recuperação de senha, edição de hábito (só criar e arquivar), criação de grupos
pela interface (vêm do seed), paginação do mural e testes automatizados.

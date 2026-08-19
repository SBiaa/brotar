import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

/** PRNG com semente: o seed precisa ser reprodutível entre máquinas. */
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Os dias precisam bater com o fuso que o app usa para decidir o que é "hoje",
// senão à noite no Brasil o seed marca o dia seguinte em UTC.
const TIMEZONE = process.env.APP_TIMEZONE ?? "America/Sao_Paulo";

const TODAY = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

function isoDaysAgo(days: number): string {
  const [year, month, day] = TODAY.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() - days);
  return cursor.toISOString().slice(0, 10);
}

const GROUPS = [
  {
    slug: "corrida-dos-recomecos",
    name: "Corrida dos recomeços",
    category: "Movimento",
    description:
      "Pra quem parou e quer voltar a correr sem pressão — 5km por semana, sem culpa por dias perdidos.",
  },
  {
    slug: "leitura-antes-de-dormir",
    name: "Leitura antes de dormir",
    category: "Estudo",
    description:
      "Trocamos recomendações e marcamos páginas lidas em vez de livros terminados.",
  },
  {
    slug: "cinco-minutos-de-silencio",
    name: "5 minutos de silêncio",
    category: "Mente",
    description:
      'Meditação guiada curtinha, todo santo dia. Ideal pra quem acha que "não tem tempo".',
  },
  {
    slug: "desenho-sem-pressao",
    name: "Desenho sem pressão",
    category: "Criação",
    description: "Um traço por dia. Sem talento exigido, só constância.",
  },
];

type SeedUser = {
  email: string;
  name: string;
  password: string;
  daysAgoJoined: number;
  habits: { name: string; category: string; probability: number; startedDaysAgo: number }[];
  groups: string[];
  events: { type: string; message: string; hoursAgo: number }[];
};

const USERS: SeedUser[] = [
  {
    email: "ana@brotar.app",
    name: "Ana Rocha",
    password: "brotar123",
    daysAgoJoined: 160,
    habits: [
      { name: "Corrida leve", category: "Movimento", probability: 0.55, startedDaysAgo: 150 },
      { name: "Meditar 5 min", category: "Mente", probability: 0.4, startedDaysAgo: 120 },
      { name: "Ler 10 páginas", category: "Estudo", probability: 0.65, startedDaysAgo: 150 },
    ],
    groups: ["corrida-dos-recomecos", "leitura-antes-de-dormir"],
    events: [],
  },
  {
    email: "marina@brotar.app",
    name: "Marina Alves",
    password: "brotar123",
    daysAgoJoined: 90,
    habits: [
      { name: "Corrida leve", category: "Movimento", probability: 0.8, startedDaysAgo: 80 },
    ],
    groups: ["corrida-dos-recomecos"],
    events: [
      {
        type: "STREAK",
        message: "completou <b>14 dias seguidos</b> de corrida leve 🏃‍♀️",
        hoursAgo: 0.2,
      },
    ],
  },
  {
    email: "joao@brotar.app",
    name: "João Beltrão",
    password: "brotar123",
    daysAgoJoined: 70,
    habits: [{ name: "Ler 10 páginas", category: "Estudo", probability: 0.5, startedDaysAgo: 60 }],
    groups: ["leitura-antes-de-dormir"],
    events: [
      {
        type: "RESTART",
        message:
          "recomeçou o hábito de <b>leitura</b> depois de 2 semanas de pausa — e está tudo bem 🌱",
        hoursAgo: 0.7,
      },
    ],
  },
  {
    email: "bia@brotar.app",
    name: "Bia Nunes",
    password: "brotar123",
    daysAgoJoined: 120,
    habits: [{ name: "Meditar 5 min", category: "Mente", probability: 0.9, startedDaysAgo: 100 }],
    groups: ["cinco-minutos-de-silencio"],
    events: [
      {
        type: "STREAK",
        message: "bateu o recorde pessoal: <b>30 dias</b> meditando",
        hoursAgo: 2,
      },
    ],
  },
  {
    email: "rafael@brotar.app",
    name: "Rafael Serra",
    password: "brotar123",
    daysAgoJoined: 20,
    habits: [{ name: "Desenhar 1 traço", category: "Criação", probability: 0.6, startedDaysAgo: 15 }],
    groups: ["desenho-sem-pressao", "cinco-minutos-de-silencio"],
    events: [
      { type: "JOIN_GROUP", message: "entrou no grupo <b>Desenho sem pressão</b> 🎨", hoursAgo: 5 },
    ],
  },
];

async function main() {
  // Idempotente: rodar de novo recria tudo do zero.
  await prisma.reaction.deleteMany();
  await prisma.feedEvent.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.habitEntry.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const groupsBySlug = new Map<string, string>();
  for (const group of GROUPS) {
    const created = await prisma.group.create({ data: group });
    groupsBySlug.set(group.slug, created.id);
  }

  const passwordHash = await bcrypt.hash("brotar123", 10);
  let seedCounter = 1;

  for (const user of USERS) {
    const createdAt = new Date();
    createdAt.setUTCDate(createdAt.getUTCDate() - user.daysAgoJoined);

    const created = await prisma.user.create({
      data: { email: user.email, name: user.name, passwordHash, createdAt },
    });

    for (const habit of user.habits) {
      const habitCreatedAt = new Date();
      habitCreatedAt.setUTCDate(habitCreatedAt.getUTCDate() - habit.startedDaysAgo);

      const createdHabit = await prisma.habit.create({
        data: {
          userId: created.id,
          name: habit.name,
          category: habit.category,
          createdAt: habitCreatedAt,
        },
      });

      const random = makeRandom(seedCounter++ * 7919);
      const dates: string[] = [];
      // Hoje fica em aberto de propósito: a tela "Hoje" precisa ter o que marcar.
      for (let daysAgo = habit.startedDaysAgo; daysAgo >= 1; daysAgo--) {
        if (random() < habit.probability) dates.push(isoDaysAgo(daysAgo));
      }

      if (dates.length) {
        await prisma.habitEntry.createMany({
          data: dates.map((date) => ({ habitId: createdHabit.id, date })),
        });
      }
    }

    for (const slug of user.groups) {
      const groupId = groupsBySlug.get(slug);
      if (groupId) {
        await prisma.membership.create({ data: { userId: created.id, groupId } });
      }
    }

    for (const event of user.events) {
      const eventCreatedAt = new Date(Date.now() - event.hoursAgo * 3_600_000);
      await prisma.feedEvent.create({
        data: {
          userId: created.id,
          type: event.type,
          message: event.message,
          createdAt: eventCreatedAt,
        },
      });
    }
  }

  const counts = {
    usuários: await prisma.user.count(),
    hábitos: await prisma.habit.count(),
    marcações: await prisma.habitEntry.count(),
    grupos: await prisma.group.count(),
    posts: await prisma.feedEvent.count(),
  };

  console.log("Seed pronto:", counts);
  console.log("Entre com ana@brotar.app / brotar123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

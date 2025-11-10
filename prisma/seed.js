// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const targets = [
  {
    name: 'AMBIENTE DEV PRINCIPAL',
    url: process.env.DATABASE_URL,
    records: 200,
  },
  {
    name: 'CLIENTE FARMACIA (DEV)',
    url: 'postgresql://postgres:Unico%40123@145.223.27.100:5432/cliente_farmacia_dev',
    records: 50,
  },
  {
    name: 'CLIENTE POSTO (DEV)',
    url: 'postgresql://postgres:Unico%40123@145.223.27.100:5432/cliente_posto_dev',
    records: 50,
  },
];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(2);
const getRandomStatus = () => ['A', 'B', 'C', 'D'][getRandomInt(0, 3)];

async function seedDatabase(target) {
  console.log(`\n🌱 --- Iniciando Seed: ${target.name} ---`);
  console.log(`🔌 Conectando em: ${target.url.split('@')[1]}`);

  try {
    execSync(`npx prisma db push --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: target.url },
      stdio: 'ignore',
    });
  } catch (e) {
    console.error(`❌ Erro ao sincronizar ${target.name}.`);
    return;
  }

  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });

  try {
    await prisma.itemOrcamento.deleteMany({});
    await prisma.orcamento.deleteMany({});
    await prisma.embalagem.deleteMany({});
    await prisma.unidadeNegocio.deleteMany({});

    const filial = await prisma.unidadeNegocio.create({ data: { codigo: '01' } });
    const embalagens = await Promise.all([
      prisma.embalagem.create({ data: { descricao: 'UNIDADE' } }),
      prisma.embalagem.create({ data: { descricao: 'CAIXA C/12' } }),
    ]);

    console.log(`🚀 Gerando ${target.records} orçamentos...`);
    
    const orcamentoPromises = [];
    for (let i = 1; i <= target.records; i++) {
      const numItens = getRandomInt(1, 5);
      const itensData = Array.from({ length: numItens }).map(() => ({
          embalagemid: embalagens[getRandomInt(0, embalagens.length - 1)].id,
          quantidade: getRandomInt(1, 100),
          valortotal: (getRandomInt(1, 100) * getRandomFloat(10, 500)).toFixed(2),
      }));

      orcamentoPromises.push(
        prisma.orcamento.create({
          data: {
            // GERA "000001", "000002", etc. (String numérica)
            codigo: String(i).padStart(6, '0'), 
            status: getRandomStatus(),
            unidadenegocioid: filial.id,
            itens: { create: itensData },
          },
        })
      );
    }

    await Promise.all(orcamentoPromises);
    console.log(`✅ ${target.name} populado!`);

  } catch (err) {
    console.error(`❌ Erro em ${target.name}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  for (const target of targets) {
    await seedDatabase(target);
  }
  console.log('\n🏁 SEED FINALIZADO 🏁');
}

main();
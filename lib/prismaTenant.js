// lib/prismaTenant.js
import { PrismaClient } from '@prisma/client';

export const createTenantPrisma = (databaseUrl) => {
  if (!databaseUrl?.startsWith('postgresql://')) {
    throw new Error('DATABASE URL inválida: ' + databaseUrl);
  }

  return new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });
};

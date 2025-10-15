import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton instance
 * Ensures only one instance of Prisma Client is created
 */

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections due to hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Initialize default users
 * This function seeds the database with the 2 authorized users if they don't exist
 */
export async function initializeDefaultUsers() {
  const authorizedUsers = [
    { email: 'frederik@agicon.be', name: 'Frederik' },
    { email: 'pascale@easylegal.be', name: 'Pascale' },
  ];

  for (const user of authorizedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
}

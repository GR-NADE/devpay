import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
	pool: Pool | undefined;
};

const pool =
	globalForPrisma.pool ??
	new Pool({
		connectionString: process.env.DATABASE_URL!,
		ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
		max: 10,
		idleTimeoutMillis: 300_000,
		connectionTimeoutMillis: 5_000,
	});

if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool;

const adapter = new PrismaPg(pool);

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
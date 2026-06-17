import { prisma } from '../prisma/client';
import { hashPassword, generateAccessToken } from '../services/authService';

export const createTestUser = async (label: string) => {
    const email = `test-${label}-${Date.now()}@example.com`;
    const passwordHash = await hashPassword('password123');

    const user = await prisma.user.create({
        data: { email, passwordHash, name: 'Test User' },
    })

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    return { user, accessToken };
};

export const cleanupUser = async (userId: string): Promise<void> => {
    await prisma.lineItem.deleteMany({ where: { invoice: { userId } } });
    await prisma.invoice.deleteMany({ where: { userId } });
    await prisma.client.deleteMany({ where: { userId } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
};
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma/client';

describe('Auth - register and login', () => {
    const email = `auth-test-${Date.now()}@example.com`;
    const password = 'password123';

    afterAll(async () => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user)
        {
            await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
    });

    it('registers a new user successfully', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email,
            password,
            name: 'Auth Test User',
        });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.email).toBe(email);
    });

    it('rejects login with the wrong password', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email,
            password: 'wrongpassword',
        });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });
});
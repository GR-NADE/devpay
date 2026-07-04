import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma/client';

vi.mock('resend', () => {
    return {
        Resend: class {
            emails = {
                send: vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
            };
        },
    };
});

describe('Auth - register and login', () => {
    const email = `auth-test-${Date.now()}@example.com`;
    const password = 'Password123';

    afterAll(async () => {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user)
        {
            await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
        }
        await prisma.pendingVerification.deleteMany({ where: { email } }); 
    });

    it('registers a new user and returns a verification message', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email,
            password,
            name: 'Auth Test User',
        });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('verify');
        expect(res.body).not.toHaveProperty('accessToken');
    });

    it('blocks login for an unverified user with a helpful message', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email,
            password,
        });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toContain('verify');
    });

    it('rejects login with the wrong password for an unverified user', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email,
            password: 'wrongpassword',
        });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('rejects duplicate registration while a pending verification exists', async () => {
        const res = await request(app).post('/api/auth/register').send({
            email,
            password,
            name: 'Auth Test User',
        });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty('error');
    });
});
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma/client';
import { createTestUser, cleanupUser } from './helpers';

describe('Invoices - access control', () => {
    let userId: string;
    let publicToken: string;

    beforeAll(async () => {
        const { user } = await createTestUser('invoice');
        userId = user.id;

        const client = await prisma.client.create({
            data: {
                userId,
                name: 'Test Client',
                email: 'client@example.com',
            },
        });

        const invoice = await prisma.invoice.create({
            data: {
                userId,
                clientId: client.id,
                invoiceNumber: 'INV-TEST-0001',
                dueDate: new Date('2026-12-31'),
                status: 'SENT',
                lineItems: {
                    create: [{ description: 'Test work', quantity: 1, unitPrice: 100 }],
                },
            },
        });

        publicToken = invoice.publicToken;
    });

    afterAll(async () => {
        await cleanupUser(userId);
    });

    it('rejects invoice creation without an access token', async () => {
        const res = await request(app).post('/api/invoices').send({
            clientId: 'irrelevant',
            dueDate: '2026-12-31',
            lineItems: [{ description: 'Work', quantity: 1, unitPrice: 100 }],
        });

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    it('allows public access to an invoice via its public token, without internal fields', async () => {
        const res = await request(app).get(`/api/invoices/public/${publicToken}`);

        expect(res.status).toBe(200);
        expect(res.body.invoiceNumber).toBe('INV-TEST-0001');
        expect(res.body).not.toHaveProperty('userId');
        expect(res.body).not.toHaveProperty('stripeSessionId');
    });
});
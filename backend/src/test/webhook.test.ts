import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { prisma } from '../prisma/client';
import { createTestUser, cleanupUser } from './helpers';

vi.mock('resend', () => {
    return {
        Resend: class {
            emails = {
                send: vi.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
            };
        },
    };
});

describe('Stripe webhook — checkout.session.completed', () => {
    let userId: string;
    let invoiceId: string;

    beforeAll(async () => {
        const { user } = await createTestUser('webhook');
        userId = user.id;

        const client = await prisma.client.create({
            data: {
                userId,
                name: 'Webhook Client',
                email: 'webhook-client@example.com',
            },
        });

        const invoice = await prisma.invoice.create({
            data: {
                userId,
                clientId: client.id,
                invoiceNumber: 'INV-TEST-WEBHOOK-0001',
                dueDate: new Date('2026-12-31'),
                status: 'SENT',
                lineItems: {
                    create: [{ description: 'Webhook test work', quantity: 1, unitPrice: 200 }],
                },
            },
        });

        invoiceId = invoice.id;
    });

    afterAll(async () => {
        await cleanupUser(userId);
    });

    it('marks the invoice as PAID when a valid checkout.session.completed event is received', async () => {
        const { stripe } = await import('../services/stripeService');
        const app = (await import('../app')).default;

        const payload = JSON.stringify({
            id: 'evt_test_webhook',
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    id: 'cs_test_123',
                    object: 'checkout.session',
                    metadata: { invoiceId, publicToken: 'irrelevant' },
                },
            },
        });

        const signature = stripe.webhooks.generateTestHeaderString({
            payload,
            secret: process.env.STRIPE_WEBHOOK_SECRET!,
        });

        const res = await request(app)
            .post('/api/webhooks/stripe')
            .set('Content-Type', 'application/json')
            .set('stripe-signature', signature)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ received: true });

        const updated = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        expect(updated?.status).toBe('PAID');
        expect(updated?.paidAt).not.toBeNull();
    });
});
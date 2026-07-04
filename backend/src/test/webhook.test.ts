import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app';
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

vi.mock('../services/paystackService', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/paystackService')>();
    return {
        ...actual,
        verifyTransaction: vi.fn().mockResolvedValue({
            status: 'success',
            reference: 'devpay-test-reference',
            amount: 20000,
            currency: 'NGN',
            metadata: {},
        }),
    };
});

const buildPaystackSignature = (payload: string): string => {
    return crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
        .update(payload)
        .digest('hex');
};

describe('Paystack webhook — checkout.success', () => {
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

    it('marks the invoice as PAID when a valid charge.success event is received', async () => {
        const payload = JSON.stringify({
            event: 'charge.success',
            data: {
                reference: 'devpay-test-reference',
                status: 'success',
                metadata: {
                    invoiceId,
                    invoiceNumber: 'INV-TEST-WEBHOOK-0001',
                    publicToken: 'irrelevant',
                },
            },
        });

        const signature = buildPaystackSignature(payload);

        const res = await request(app)
            .post('/api/webhooks/paystack')
            .set('Content-Type', 'application/json')
            .set('x-paystack-signature', signature)
            .send(payload);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ received: true });

        const updated = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        expect(updated?.status).toBe('PAID');
        expect(updated?.paidAt).not.toBeNull();
    });

    it('rejects webhook events with an invalid signature', async () => {
        const payload = JSON.stringify({
            event: 'charge.success',
            data: { reference: 'fake', status: 'success', metadata: { invoiceId } },
        });

        const res = await request(app)
            .post('/api/webhooks/paystack')
            .set('Content-Type', 'application/json')
            .set('x-paystack-signature', 'invalidsignature')
            .send(payload);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('signature');
    })
});
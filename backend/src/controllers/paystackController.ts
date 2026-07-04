import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../prisma/client';
import {
    initializeTransaction,
    verifyTransaction,
    verifyWebhookSignature,
} from '../services/paystackService';
import { sendPaymentConfirmationEmail } from '../services/emailService';
import { calculateTotal } from '../services/invoiceService';

const param = (value: string | string[]) : string =>
    Array.isArray(value) ? value[0] : value;

export const createPaymentSession = async (
    req: Request,
    res: Response,
    next: NextFunction,
) : Promise<void> => {
    try
    {
        const invoice = await prisma.invoice.findFirst({
            where: { publicToken: param(req.params.token) },
            include: { client: true, lineItems: true, user: true },
        });

        if (!invoice)
        {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        if (invoice.status === 'PAID')
        {
            res.status(400).json({ error: 'Invoice already paid' });
            return;
        }

        if (invoice.status === 'DRAFT')
        {
            res.status(400).json({ error: 'Invoice is not yet sent' });
            return;
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const callbackUrl = `${frontendUrl}/pay/${invoice.publicToken}/success`;
        const reference = `devpay-${invoice.id}-${crypto.randomBytes(6).toString('hex')}`;
        const totalAmount = calculateTotal(invoice.lineItems);

        const transaction = await initializeTransaction({
            email: invoice.client.email,
            amountNGN: totalAmount,
            reference,
            callbackUrl,
            metadata: {
                invoiceId: invoice.id,
                publicToken: invoice.publicToken,
                invoiceNumber: invoice.invoiceNumber,
            },
            subaccountCode: invoice.user.paystackSubaccountCode ?? undefined,
        });

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { paystackReference: reference },
        });

        res.json({ url: transaction.authorization_url });
    }
    catch (err)
    {
        next(err);
    }
};

export const handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction,
) : Promise<void> => {
    try
    {
        const signature = req.headers['x-paystack-signature'] as string;

        if (!signature)
        {
            res.status(400).json({ error: 'Missing Paystack signature' });
            return;
        }

        const rawBody = (req as Request & { rawBody?: string }).rawBody;

        if (!rawBody)
        {
            res.status(400).json({ error: 'Missing raw body for signature verification' });
            return;
        }

        if (!verifyWebhookSignature(rawBody, signature))
        {
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
        }

        const event = req.body as {
            event: string;
            data: {
                reference: string;
                status: string;
                metadata: { invoiceId: string; invoiceNumber: string };
            };
        };

        if (event.event === 'charge.success')
        {
            const { reference, metadata } = event.data;

            if (!metadata?.invoiceId)
            {
                res.status(400).json({ error: 'Missing invoiceId in metadata' });
                return;
            }

            const verified = await verifyTransaction(reference);

            if (verified.status !== 'success')
            {
                res.status(400).json({ error: 'Transaction verification failed' });
                return;
            }

            const invoice = await prisma.invoice.update({
                where: { id: metadata.invoiceId },
                data: { status: 'PAID', paidAt: new Date() },
                include: { client: true },
            });

            await sendPaymentConfirmationEmail(
                invoice.client.email,
                invoice.client.name,
                invoice.invoiceNumber,
            );
        }

        res.json({ received: true });
    }
    catch (err)
    {
        next(err);
    }
};
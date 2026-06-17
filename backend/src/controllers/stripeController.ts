import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { stripe, createCheckoutSession } from '../services/stripeService';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
            include: { client: true, lineItems: true },
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
        }

        const frontendUrl = process.env.FRONTEND_URL || 'https://localhost:5173';

        const session = await createCheckoutSession({
            invoiceId: invoice.id,
            publicToken: invoice.publicToken,
            lineItems: invoice.lineItems,
            clientEmail: invoice.client.email,
            frontendUrl,
        });

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { stripeSessionId: session.id },
        });

        res.json({ url: session.url });
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
    const sig = req.headers['stripe-signature'];

    if (!sig)
    {
        res.status(400).json({ error: 'Missing stripe signature' });
        return;
    }

    let event;

    try
    {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );
    }
    catch (err)
    {
        res.status(400).json({ error: `Webhook signature verification failed` });
        return;
    }

    try
    {
        if (event.type === 'checkout.session.completed')
        {
            const session = event.data.object;
            const invoiceId = session.metadata?.invoiceId;

            if (!invoiceId)
            {
                res.status(400).json({ error: 'Missing invoiceId in metadata' });
                return;
            }

            const invoice = await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID', paidAt: new Date() },
                include: { client: true, lineItems: true },
            });

            await resend.emails.send({
                from: 'DevPay <onboarding@resend.dev>',
                to: invoice.client.email,
                subject: `Payment recieved - Invoice ${invoice.invoiceNumber}`,
                html: `
                    <h2>Payment Received</h2>
                    <p>Hi ${invoice.client.name},</p>
                    <p>We've received your payment for invoice <strong>${invoice.invoiceNumber}</strong>.</p>
                    <p>Thank you for your business.</p>
                `,
            });
        }

        res.json({ received: true});
    }
    catch (err)
    {
        next(err);
    }
};
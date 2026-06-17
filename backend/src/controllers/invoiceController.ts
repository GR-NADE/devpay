import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { generateInvoiceNumber, isValidStatusTransition } from '../services/invoiceService';
import { InvoiceStatus } from '@prisma/client';

const param = (value: string | string[]): string =>
    Array.isArray(value) ? value[0] : value;

export const getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const invoices = await prisma.invoice.findMany({
            where: { userId: req.user!.userId },
            include: { client: true, lineItems: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(invoices);
    }
    catch (err)
    {
        next(err);
    }
};

export const getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const invoice = await prisma.invoice.findFirst({
            where: { id: param(req.params.id), userId: req.user!.userId },
            include: { client: true, lineItems: true },
        });

        if (!invoice)
        {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        res.json(invoice);
    }
    catch (err)
    {
        next(err);
    }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const { clientId, dueDate, lineItems } = req.body;

        if (!clientId || !dueDate || !lineItems || lineItems.length === 0)
        {
            res.status(400).json({ error: 'clientId, dueDate, and at least one line item are required' });
            return;
        }

        const client = await prisma.client.findFirst({
            where: { id: clientId, userId: req.user!.userId }
        });

        if (!client)
        {
            res.status(404).json({ error: 'Client not found' });
            return;
        }

        const latest = await prisma.invoice.findFirst({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: 'desc' },
            select: { invoiceNumber: true },
        });

        const invoiceNumber = generateInvoiceNumber(latest?.invoiceNumber ?? null);

        const invoice = await prisma.invoice.create({
            data: {
                userId: req.user!.userId,
                clientId,
                invoiceNumber,
                dueDate: new Date(dueDate),
                lineItems: {
                    create: lineItems.map((item: { description: string; quantity: number; unitPrice: number }) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },
            include: { client: true, lineItems: true },
        });

        res.status(201).json(invoice);
    }
    catch (err)
    {
        next(err);
    }
};

export const updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const { status } = req.body;

        if (!status)
        {
            res.status(400).json({ error: 'Status is required' });
            return;
        }

        const existing = await prisma.invoice.findFirst({
            where: { id: param(req.params.id), userId: req.user!.userId },
        });

        if (!existing)
        {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        if (!isValidStatusTransition(existing.status, status))
        {
            res.status(400).json({
                error: `Cannot transition from ${existing.status} to ${status}`,
            });
            return;
        }

        const invoice = await prisma.invoice.update({
            where: { id: param(req.params.id) },
            data: {
                status: status as InvoiceStatus,
                ...(status === 'PAID' && { paidAt: new Date() }),
            },
            include: { client: true, lineItems: true },
        });

        res.json(invoice);
    }
    catch (err)
    {
        next(err);
    }
};

export const deleteInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const existing = await prisma.invoice.findFirst({
            where: { id: param(req.params.id), userId: req.user!.userId },
        });

        if (!existing)
        {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        if (existing.status !== 'DRAFT')
        {
            res.status(400).json({ error: 'Only DRAFT invoices can be deleted' });
            return;
        }

        await prisma.invoice.delete({ where: {id: param(req.params.id)} });

        res.json({ message: 'Invoice deleted successfully' });
    }
    catch (err)
    {
        next(err);
    }
};

export const getPublicInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

        const { userId, stripeSessionId, ...publicInvoice } = invoice;

        res.json(publicInvoice);
    }
    catch (err)
    {
        next(err);
    }
};
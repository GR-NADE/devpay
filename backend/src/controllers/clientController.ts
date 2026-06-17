import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';

const param = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const clients = await prisma.client.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(clients);
    }
    catch (err)
    {
        next(err);
    }
};

export const getClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const client = await prisma.client.findFirst({
            where: { id: param(req.params.id), userId: req.user!.userId },
        });

        if (!client)
        {
            res.status(404).json({ error: 'Client not found' });
            return;
        }

        res.json(client);
    }
    catch (err)
    {
        next(err);
    }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const { name, email, company, billingAddress } = req.body;

        if (!name || !email)
        {
            res.status(400).json({ error: 'Name and email are required' });
            return;
        }

        const client = await prisma.client.create({
            data: {
                userId: req.user!.userId,
                name,
                email,
                company: company ?? null,
                billingAddress: billingAddress ?? null,
            },
        });

        res.status(201).json(client);
    }
    catch (err)
    {
        next(err);
    }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const { name, email, company, billingAddress } = req.body;

        const existing = await prisma.client.findFirst({
            where: { id: param(req.params.id), userId: req.user!.userId },
        });

        if (!existing)
        {
            res.status(404).json({ error: 'Client not found' });
            return;
        }

        const client = await prisma.client.update({
            where: { id: param(req.params.id) },
            data: {
                name: name ?? existing.name,
                email: email ?? existing.email,
                company: company ?? existing.company,
                billingAddress: billingAddress ?? existing.billingAddress,
            },
        });

        res.json(client);
    }
    catch (err)
    {
        next(err);
    }
};

export const deleteClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const existing = await prisma.client.findFirst({
            where: { id: param(req.params.id), userId: req.user!.userId },
        });

        if (!existing)
        {
            res.status(404).json({ error: 'Client not found' });
            return;
        }

        await prisma.client.delete({ where: { id: param(req.params.id) } });

        res.json({ message: 'Client deleted successfully' });
    }
    catch (err)
    {
        next(err);
    }
};
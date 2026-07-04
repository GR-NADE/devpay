import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import {
    getBanks,
    resolveAccount,
    createSubaccount,
} from '../services/paystackService';

export const getSettings = async (
    req: Request,
    res: Response,
    next: NextFunction,
) : Promise<void> => {
    try
    {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                name: true,
                bankName: true,
                accountNumber: true,
                accountName: true,
                paystackSubaccountCode: true,
            },
        });

        if (!user)
        {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            ...user,
            bankConnected: !!user.paystackSubaccountCode,
        });
    }
    catch (err)
    {
        next(err);
    }
};

export const listBanks = async (
    _req: Request,
    res: Response,
    next: NextFunction,
) : Promise<void> => {
    try
    {
        const banks = await getBanks();
        res.json(banks);
    }
    catch (err)
    {
        next(err);
    }
};

export const resolveAccountNumber = async (
    req: Request,
    res: Response,
    next: NextFunction,
) : Promise<void> => {
    try
    {
        const { accountNumber, bankCode } = req.query as {
            accountNumber: string;
            bankCode: string;
        };

        if (!accountNumber || !bankCode)
        {
            res.status(400).json({ error: 'accountNumber and bankCode are required' });
            return;
        }

        const resolved = await resolveAccount(accountNumber, bankCode);
        res.json(resolved);
    }
    catch (err)
    {
        const message = err instanceof Error ? err.message : 'Could not resolve account';
        res.status(400).json({ error: message });
    }
};

export const connectBank = async (
    req: Request,
    res: Response,
    next: NextFunction,
) : Promise<void> => {
    try
    {
        const { bankCode, bankName, accountNumber, accountName } = req.body;

        if (!bankCode || !bankName || !accountNumber || !accountName)
        {
            res.status(400).json({ error: 'bankCode, bankName, accountNumber, and accountName are required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: { name: true, paystackSubaccountCode: true },
        });

        if (!user)
        {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        if (user.paystackSubaccountCode)
        {
            await prisma.user.update({
                where: { id: req.user!.userId },
                data: { bankName, bankCode, accountNumber, accountName },
            });
            res.json({ message: 'Bank details updated successfully' });
            return;
        }

        const subaccount = await createSubaccount({
            businessName: user.name,
            bankCode,
            accountNumber,
        });

        await prisma.user.update({
            where: { id: req.user!.userId },
            data: {
                paystackSubaccountCode: subaccount.subaccount_code,
                bankName,
                bankCode,
                accountNumber,
                accountName,
            },
        });

        res.json({ message: 'Bank account connected successfully' });
    }
    catch (err)
    {
        next(err);
    }
};
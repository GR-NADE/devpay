import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { calculateTotal } from '../services/invoiceService';

export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const userId = req.user!.userId;

        const invoices = await prisma.invoice.findMany({
            where: { userId },
            include: { lineItems: true },
        });

        const paidInvoices = invoices.filter((inv) => inv.status === 'PAID');
        const totalRevenue = paidInvoices.reduce(
            (sum, inv) => sum + calculateTotal(inv.lineItems),
            0,
        );

        const outstandingInvoices = invoices.filter(
            (inv) => inv.status === 'SENT' || inv.status === 'OVERDUE',
        );
        const outstandingBalance = outstandingInvoices.reduce(
            (sum, inv) => sum + calculateTotal(inv.lineItems),
            0,
        );

        const counts = {
            DRAFT: 0,
            SENT: 0,
            PAID: 0,
            OVERDUE: 0,
        };

        for (const inv of invoices)
        {
            counts[inv.status]++;
        }

        res.json({
            totalRevenue,
            outstandingBalance,
            invoiceCounts: counts,
            totalInvoices: invoices.length,
        });
    }
    catch (err)
    {
        next(err);
    }
}
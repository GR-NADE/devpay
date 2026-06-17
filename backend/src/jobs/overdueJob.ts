import cron from 'node-cron';
import { prisma } from '../prisma/client';

export const markOverdueInvoices = async (): Promise<number> => {
    const result = await prisma.invoice.updateMany({
        where: {
            status: 'SENT',
            dueDate: { lt: new Date() },
        },
        data: { status: 'OVERDUE' },
    });

    return result.count;
};

export const startOverdueJob = (): void => {
    cron.schedule('0 0 * * *', async () => {
        console.log('[cron] Checking for overdue invoices...');
        try
        {
            const count = await markOverdueInvoices();
            console.log(`[cron] Marked ${count} invoice(s) as OVERDUE`);
        }
        catch (err)
        {
            console.error('[cron] Overdue job failed:', err);
        }
    });

    console.log('[cron] Overdue job scheduled');
};
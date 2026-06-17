export const calculateTotal = (
    lineItems: { quantity: unknown; unitPrice: unknown }[],
) : number => {
    return lineItems.reduce((sum, item) => {
        const qty = Number(item.quantity);
        const price = Number(item.unitPrice);
        return sum + qty * price;
    }, 0);
};

export const generateInvoiceNumber = (latestNumber: string | null): string => {
    if (!latestNumber) return 'INV-0001';
    const current = parseInt(latestNumber.replace('INV-', ''), 10);
    const next = current + 1;
    return `INV-${String(next).padStart(4, '0')}`;
};

export const isValidStatusTransition = (
    current: string,
    next: string,
) : boolean => {
    const allowed: Record<string, string[]> = {
        DRAFT: ['SENT'],
        SENT: ['PAID', 'OVERDUE'],
        OVERDUE: ['PAID'],
        PAID: [],
    };
    return allowed[current]?.includes(next) ?? false;
};

export const shouldMarkOverdue = (
    status: string,
    dueDate: Date,
    now: Date = new Date(),
): boolean => {
    return status === 'SENT' && dueDate < now;
}
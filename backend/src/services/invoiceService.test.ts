import { describe, it, expect } from 'vitest';
import {
    calculateTotal,
    generateInvoiceNumber,
    isValidStatusTransition,
    shouldMarkOverdue,
} from './invoiceService';

describe('calculateTotal', () => {
    it('calculates total for a single item', () => {
        const total = calculateTotal([{ quantity: 2, unitPrice: 50 }]);
        expect(total).toBe(100);
    });

    it('calculates total across multiple line items', () => {
        const total = calculateTotal([
            { quantity: 1, unitPrice: 500 },
            { quantity: 2, unitPrice: 75 },
        ]);
        expect(total).toBe(650);
    });

    it('return 0 for an empty list', () => {
        expect(calculateTotal([])).toBe(0);
    });

    it('handles string-based decimal values', () => {
        const total = calculateTotal([{ quantity: '3', unitPrice: '10.50' }]);
        expect(total).toBe(31.5);
    });
});

describe('generateInvoiceNumber', () => {
    it('generates INV-0001 when there is no previous invoice', () => {
        expect(generateInvoiceNumber(null)).toBe('INV-0001');
    });

    it('increments the invoice number correctly', () => {
        expect(generateInvoiceNumber('INV-0001')).toBe('INV-0002');
    });

    it('pads numbers to 4 digits', () => {
        expect(generateInvoiceNumber('INV-0009')).toBe('INV-0010');
    });

    it('handles larger numbers without truncation', () => {
        expect(generateInvoiceNumber('INV-9999')).toBe('INV-10000');
    });
});

describe('isValidStatusTransition', () => {
    it('allows DRAFT to SENT', () => {
        expect(isValidStatusTransition('DRAFT', 'SENT')).toBe(true);
    });

    it('allows SENT to PAID', () => {
        expect(isValidStatusTransition('SENT', 'PAID')).toBe(true);
    });

    it('allows SENT to OVERDUE', () => {
        expect(isValidStatusTransition('SENT', 'OVERDUE')).toBe(true);
    });

    it('allows OVERDUE to PAID', () => {
        expect(isValidStatusTransition('OVERDUE', 'PAID')).toBe(true);
    });

    it('rejects PAID to any other status', () => {
        expect(isValidStatusTransition('PAID', 'SENT')).toBe(false);
        expect(isValidStatusTransition('PAID', 'OVERDUE')).toBe(false);
    });

    it('rejects unknown statuses', () => {
        expect(isValidStatusTransition('UNKNOWN', 'SENT')).toBe(false);
    });
});

describe('shouldMarkOverdue', () => {
    it('marks a SENT invoice as overdue if due date is in the past', () => {
        const dueDate = new Date('2026-01-01');
        const now = new Date('2026-02-01');
        expect(shouldMarkOverdue('SENT', dueDate, now)).toBe(true);
    });

    it('does not mark a SENT invoice as overdue if due date is in the future', () => {
        const dueDate = new Date('2026-12-01');
        const now = new Date('2026-02-01');
        expect(shouldMarkOverdue('SENT', dueDate, now)).toBe(false);
    });

    it('does not mark a DRAFT invoice as overdue regardless of due date', () => {
        const dueDate = new Date('2026-01-01');
        const now = new Date('2026-02-01');
        expect(shouldMarkOverdue('DRAFT', dueDate, now)).toBe(false);
    });

    it('does not mark a PAID invoice as overdue', () => {
        const dueDate = new Date('2026-01-01');
        const now = new Date('2026-02-01');
        expect(shouldMarkOverdue('PAID', dueDate, now)).toBe(false);
    });
})
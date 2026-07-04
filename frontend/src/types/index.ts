export interface User {
    id: string;
    email: string;
    name: string;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    paystackSubaccountCode?: string | null;
    bankConnected?: boolean;
}

export interface Bank {
    id: number;
    name: string;
    code: string;
}

export interface ResolvedAccount {
    account_number: string;
    account_name: string;
    ban_id: number;
}

export interface UserSettings {
    id: string;
    email: string;
    name: string;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
    paystackSubaccountCode: string | null;
    bankConnected: boolean;
}

export interface Client {
    id: string;
    userId: string;
    name: string;
    email: string;
    company: string | null;
    billingAddress: string | null;
    createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface LineItem {
    id: string;
    invoiceId: string;
    description: string;
    quantity: string;
    unitPrice: string;
}

export interface Invoice {
    id: string;
    userId: string;
    clientId: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    dueDate: string;
    publicToken: string;
    paystackReference: string | null;
    paidAt: string | null;
    createdAt: string;
    client: Client;
    lineItems: LineItem[];
}

export interface PublicInvoice {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    dueDate: string;
    publicToken: string;
    paidAt: string | null;
    createdAt: string;
    client: Client;
    lineItems: LineItem[];
}

export interface DashboardStats {
    totalRevenue: number;
    outstandingBalance: number;
    invoiceCounts: {
        DRAFT: number;
        SENT: number;
        PAID: number;
        OVERDUE: number;
    };
    totalInvoices: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface ApiError {
    error: string;
}
import { apiClient } from './apiClient';
import type {
    AuthResponse,
    Client,
    Invoice,
    PublicInvoice,
    DashboardStats,
    UserSettings,
    Bank,
    ResolvedAccount,
} from '../types';

export const registerUser = async (data: { email: string; password: string; name: string }) => {
    const res = await apiClient.post<{ message: string }>('/auth/register', data);
    return res.data;
};

export const loginUser = async (data: { email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
};

export const logoutUser = async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken });
};

export const verifyEmail = async (token: string) => {
    const res = await apiClient.get<{ message: string }>(`/auth/verify-email/${token}`);
    return res.data;
};

export const requestPasswordReset = async (email: string) => {
    const res = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
};

export const resetPassword = async (token: string, password: string) => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', { token, password });
    return res.data;
};

export const getClients = async () => {
    const res = await apiClient.get<Client[]>('/clients');
    return res.data;
};

export const getClient = async (id: string) => {
    const res = await apiClient.get<Client>(`/clients/${id}`);
    return res.data;
};

export const createClient = async (data: {
    name: string;
    email: string;
    company?: string;
    billingAddress?: string;
}) => {
    const res = await apiClient.post<Client>('/clients', data);
    return res.data;
};

export const updateClient = async (id: string, data: Partial<{
    name: string;
    email: string;
    company: string;
    billingAddress: string;
}>) => {
    const res = await apiClient.put<Client>(`/clients/${id}`, data);
    return res.data;
};

export const deleteClient = async (id: string) => {
    await apiClient.delete(`/clients/${id}`);
};

export const getInvoices = async () => {
    const res = await apiClient.get<Invoice[]>('/invoices');
    return res.data;
};

export const getInvoice = async (id: string) => {
    const res = await apiClient.get<Invoice>(`/invoices/${id}`);
    return res.data;
};

export const createInvoice = async (data: {
    clientId: string;
    dueDate: string;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
}) => {
    const res = await apiClient.post<Invoice>('/invoices', data);
    return res.data;
};

export const updateInvoiceStatus = async (id: string, status: string) => {
    const res = await apiClient.patch<Invoice>(`/invoices/${id}/status`, { status });
    return res.data;
};

export const deleteInvoice = async (id: string) => {
    await apiClient.delete(`/invoices/${id}`);
};

export const getPublicInvoice = async (token: string) => {
    const res = await apiClient.get<PublicInvoice>(`/invoices/public/${token}`);
    return res.data;
};

export const getDashboardStats = async () => {
    const res = await apiClient.get<DashboardStats>('/dashboard');
    return res.data;
};

export const createPaymentSession = async (token: string) => {
    const res = await apiClient.post<{ url: string }>(`/payment/pay/${token}`);
    return res.data;
};

export const getSettings = async () => {
    const res = await apiClient.get<UserSettings>('/settings');
    return res.data;
};

export const getBanks = async () => {
    const res = await apiClient.get<Bank[]>('/settings/banks');
    return res.data;
};

export const resolveAccount = async (accountNumber: string, bankCode: string) => {
    const res = await apiClient.get<ResolvedAccount>(
        `/settings/resolve-account?accountNumber=${accountNumber}&bankCode=${bankCode}`,
    );
    return res.data;
};

export const connectBank = async (data: {
    bankCode: string;
    bankName: string;
    accountNumber: string;
    accountName: string;
}) => {
    const res = await apiClient.post<{ message: string }>('/settings/connect-bank', data);
    return res.data;
};
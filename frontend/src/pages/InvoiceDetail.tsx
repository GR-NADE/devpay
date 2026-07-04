import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoice, updateInvoiceStatus, deleteInvoice, getSettings } from '../lib/api';
import type { InvoiceStatus } from '../types';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const statusStyles: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
    SENT: 'bg-blue-100 text-blue-800 border-blue-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    OVERDUE: 'bg-red-100 text-red-800 border-red-200',
};

const nextStatusOptions: Record<InvoiceStatus, InvoiceStatus[]> = {
    DRAFT: ['SENT'],
    SENT: ['PAID'],
    OVERDUE: ['PAID'],
    PAID: [],
};

const statusActionLabels: Partial<Record<InvoiceStatus, string>> = {
    SENT: 'Mark as sent',
    PAID: 'Mark as paid',
};

const InvoiceDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: invoice, isLoading, isError } = useQuery({
        queryKey: ['invoice', id],
        queryFn: () => getInvoice(id!),
        enabled: !!id,
    });

    const statusMutation = useMutation({
        mutationFn: (status: InvoiceStatus) => updateInvoiceStatus(id!, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoice', id] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteInvoice(id!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            navigate('/invoices');
        },
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings,
    });

    const bankConnected = settings?.bankConnected ?? false;

    const handleDelete = () => {
        if (window.confirm('Delete this invoice? This cannot be undone.'))
        {
            deleteMutation.mutate();
        }
    };

    if (isLoading)
    {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF7A00]"/>
                    <p className="text-[#505050] mt-4">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (isError || !invoice)
    {
        return (
            <div className="px-4 sm:px-8 py-8">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Invoice not found</p>
                    <p>This invoice doesn't exist or you don't have access to it.</p>
                </div>
                <Link to="/invoices" className="inline-block mt-4 text-[#FF7A00] hover:text-[#CC6200] hover:underline font-semibold">
                    ← Back to invoices
                </Link>
            </div>
        );
    }

    const total = invoice.lineItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0,
    );

    const availableTransitions = nextStatusOptions[invoice.status];

    return (
        <div className="px-4 sm:px-8 py-8 max-w-4xl">
            <div className="mb-6">
                <Link to="/invoices" className="text-[#FF7A00] hover:text-[#CC6200] hover:underline font-semibold text-sm">
                    ← Back to invoices
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#3A3A3A] mb-1">{invoice.invoiceNumber}</h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[invoice.status]}`}>
                        {invoice.status}
                    </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {availableTransitions.map((status) => {
                        const isSendAction = status === 'SENT';
                        const blocked = isSendAction && !bankConnected;

                        return (
                            <div key={status} className="relative group">
                                <button
                                    onClick={() => !blocked && statusMutation.mutate(status)}
                                    disabled={statusMutation.isPending || blocked}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm shadow-lg transition duration-200 ${
                                        blocked
                                        ? 'bg-[#DAD8D9] text-[#909090] cursor-not-allowed'
                                        : 'bg-[#FF7A00] text-white hover:bg-[#CC6200] disabled:opacity-50'
                                    }`}>
                                        {statusMutation.isPending ? 'Updating...' : statusActionLabels[status]}
                                </button>
                                {blocked && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#3A3A3A] text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center z-10">
                                        Connect a bank account in Settings before sending invoices
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#3A3A3A]"/>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {invoice.status === 'DRAFT' && (
                        <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="bg-[#FFEBEB] text-[#FF3333] px-4 py-2 rounded-xl hover:bg-[#FFDADA] disabled:opacity-50 transition duration-200 font-semibold text-sm">
                                {deleteMutation.isPending ? 'Deleting...' : "Delete"}
                        </button>
                    )}
                </div>
            </div>

            {statusMutation.isError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                    <p>{(statusMutation.error as AxiosError<ApiError>)?.response?.data?.error || 'Failed to update status. Please try again.'}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-sm font-semibold text-[#909090] uppercase tracking-wide mb-3">Client</h3>
                    <p className="font-bold text-[#3A3A3A]">{invoice.client.name}</p>
                    {invoice.client.company && <p className="text-sm text-[#505050]">{invoice.client.company}</p>}
                    <p className="text-sm text-[#505050] truncate">{invoice.client.email}</p>
                    {invoice.client.billingAddress && (
                        <p className="text-sm text-[#505050] mt-1 truncate">{invoice.client.billingAddress}</p>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-sm font-semibold text-[#909090] uppercase tracking-wide mb-3">Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[#909090]">Invoice number</span>
                            <span className="font-semibold text-[#3A3A3A]">{invoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#909090]">Due date</span>
                            <span className="text-[#3A3A3A]">{formatDate(invoice.dueDate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[#909090]">Created</span>
                            <span className="text-[#3A3A3A]">{formatDate(invoice.createdAt)}</span>
                        </div>
                        {invoice.paidAt && (
                            <div className="flex justify-between">
                                <span className="text-[#909090]">Paid on</span>
                                <span className="text-green-700 font-semibold">{formatDate(invoice.paidAt)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                <div className="px-4 sm:px-6 py-4 border-b border-[#DAD8D9]">
                    <h3 className="font-bold text-[#3A3A3A]">Line items</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-125">
                        <thead className="bg-[#F0F0F0]">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-sm font-semibold text-[#505050]">Description</th>
                                <th className="px-4 sm:px-6 py-3 text-sm font-semibold text-[#505050] text-right">Qty</th>
                                <th className="px-4 sm:px-6 py-3 text-sm font-semibold text-[#505050] text-right">Unit price</th>
                                <th className="px-4 sm:px-6 py-3 text-sm font-semibold text-[#505050] text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineItems.map((item) => (
                                <tr key={item.id} className="border-t border-[#DAD8D9]">
                                    <td className="px-4 sm:px-6 py-4 text-[#3A3A3A]">{item.description}</td>
                                    <td className="px-4 sm:px-6 py-4 text-right text-[#505050]">{item.quantity}</td>
                                    <td className="px-4 sm:px-6 py-4 text-right text-[#505050]">{formatCurrency(Number(item.unitPrice))}</td>
                                    <td className="px-4 sm:px-6 py-4 text-right font-semibold text-[#3A3A3A]">
                                        {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-[#DAD8D9] bg-[#F0F0F0]">
                                <td colSpan={3} className="px-4 sm:px-6 py-4 font-bold text-[#3A3A3A] text-right">Total</td>
                                <td className="px-4 sm:px-6 py-4 font-bold text-[#3A3A3A] text-right text-lg">{formatCurrency(total)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {invoice.status === 'SENT' || invoice.status === 'OVERDUE' ? (
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                    <h3 className="font-bold text-[#3A3A3A] mb-2">Payment link</h3>
                    <p className="text-sm text-[#505050] mb-3">Share this link with your client to collect payment:</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <code className="flex-1 bg-[#F0F0F0] px-4 py-2 rounded-xl text-sm text-[#3A3A3A] truncate">
                            {window.location.origin}/pay/{invoice.publicToken}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/pay/${invoice.publicToken}`)}
                            className="bg-[#FF7A00] text-white px-4 py-2 rounded-xl hover:bg-[#CC6200] transition duration-200 font-semibold text-sm shadow-lg whitespace-nowrap">
                                Copy link
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default InvoiceDetail;
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPublicInvoice, createPaymentSession } from '../lib/api';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }). format(amount);

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const PublicInvoice = () => {
    const { token } = useParams<{ token: string }>();

    const { data: invoice, isLoading, isError } = useQuery({
        queryKey: ['public-invoice', token],
        queryFn: () => getPublicInvoice(token!),
        enabled: !!token,
    });

    const payMutation = useMutation({
        mutationFn: () => createPaymentSession(token!),
        onSuccess: (data) => {
            window.location.href = data.url;
        },
    });

    if (isLoading)
    {
        return (
            <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
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
            <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-[#3A3A3A] mb-2">Invoice not found</h2>
                    <p className="text-[#505050]">This invoice link is invalid or has expired.</p>
                </div>
            </div>
        );
    }

    const total = invoice.lineItems.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
        0,
    );

    const isPaid = invoice.status === 'PAID';
    const isDraft = invoice.status === 'DRAFT';
    const payError = payMutation.error as AxiosError<ApiError> | null;

    return (
        <div className="min-h-screen bg-[#F0F0F0] px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#FF7A00]">DevPay</h1>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="px-8 py-6 border-b border-[#DAD8D9]">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-[#3A3A3A]">{invoice.invoiceNumber}</h2>
                                <p className="text-[#505050] mt-1">Due {formatDate(invoice.dueDate)}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                isPaid
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : invoice.status === 'OVERDUE'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                                {invoice.status}
                            </span>
                        </div>
                    </div>

                    <div className="px-8 py-6 border-b border-[#DAD8D9]">
                        <h3 className="text-sm font-semibold text-[#909090] uppercase tracking-wide mb-3">Billed to</h3>
                        <p className="font-bold text-[#3A3A3A]">{invoice.client.name}</p>
                        {invoice.client.company && <p className="text-sm text-[#505050]">{invoice.client.company}</p>}
                        <p className="text-sm text-[#505050]">{invoice.client.email}</p>
                    </div>

                    <div className="px-8 py-6 border-b border-[#DAD8D9]">
                        <h3 className="text-sm font-semibold text-[#909090] uppercase tracking-wide mb-4">Items</h3>
                        <div className="space-y-3">
                            {invoice.lineItems.map((item) => (
                                <div key={item.id} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="text-[#3A3A3A] font-semibold">{item.description}</p>
                                        <p className="text-sm text-[#909090]">{item.quantity} × {formatCurrency(Number(item.unitPrice))}</p>
                                    </div>
                                    <p className="font-semibold text-[#3A3A3A] ml-4">
                                        {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-[#DAD8D9] flex justify-between items-center">
                            <span className="font-bold text-[#3A3A3A]">Total due</span>
                            <span className="text-2xl font-bold text-[#3A3A3A]">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <div className="px-8 py-6">
                        {isPaid ? (
                            <div className="text-center py-4">
                                <p className="text-green-700 font-bold text-lg mb-1">Payment received</p>
                                {invoice.paidAt && (
                                    <p className="text-sm text-[#909090]">Paid on {formatDate(invoice.paidAt)}</p>
                                )}
                            </div>
                        ) : isDraft ? (
                            <div className="text-center py-4">
                                <p className="text-[#909090]">This invoice is not yet ready for payment.</p>
                            </div>
                        ) : (
                            <>
                                {payError && (
                                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
                                        <p>{payError.response?.data?.error || 'Failed to start payment. Please try again.'}</p>
                                    </div>
                                )}
                                <button
                                    onClick={() => payMutation.mutate()}
                                    disabled={payMutation.isPending}
                                    className="w-full bg-[#FF7A00] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg text-lg">
                                        {payMutation.isPending ? 'Redirecting to payment...' : `Pay ${formatCurrency(total)}`}
                                </button>
                                <p className="text-xs text-center text-[#909090] mt-3">Secured by Paystack</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicInvoice;
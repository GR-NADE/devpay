import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, getClients, createInvoice } from '../lib/api';
import type { AxiosError } from 'axios';
import type { ApiError, InvoiceStatus } from '../types';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const statusStyles: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
    SENT: 'bg-blue-100 text-blue-800 border-blue-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    OVERDUE: 'bg-red-100 text-red-800 border-red-200',
};

interface LineItemDraft {
    description: string;
    quantity: string;
    unitPrice: string;
}

const emptyLineItem: LineItemDraft = { description: '', quantity: '1', unitPrice: '' };

const Invoices = () => {
    const [showModal, setShowModal] = useState(false);
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [lineItems, setLineItems] = useState<LineItemDraft[]>([{ ...emptyLineItem }]);
    const [formError, setFormError] = useState('');
    const queryClient = useQueryClient();

    const { data: invoices, isLoading, isError } = useQuery({
        queryKey: ['invoices'],
        queryFn: getInvoices,
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: getClients,
    });

    const createMutation = useMutation({
        mutationFn: createInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            closeModal();
        },
        onError: (err: AxiosError<ApiError>) => {
            setFormError(err.response?.data?.error || 'Failed to create invoice');
        },
    });

    const updateLineItem = (index: number, field: keyof LineItemDraft, value: string) => {
        setLineItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
        );
    };

    const addLineItem = () => {
        setLineItems((prev) => [...prev, { ...emptyLineItem }]);
    };

    const removeLineItem = (index: number) => {
        setLineItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setFormError('');

        if (!clientId)
        {
            setFormError('Select a client');
            return;
        }

        if (lineItems.length === 0)
        {
            setFormError('Add at least one line item');
            return;
        }

        const parsedItems = lineItems.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
        }));

        if (parsedItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0))
        {
            setFormError('Each line item needs a description, a quantity greater than 0, and a valid price');
            return;
        }

        createMutation.mutate({
            clientId,
            dueDate: new Date(dueDate).toISOString(),
            lineItems: parsedItems,
        });
    };

    const closeModal = () => {
        setShowModal(false);
        setClientId('');
        setDueDate('');
        setLineItems([{ ...emptyLineItem }]);
        setFormError('');
    };

    const lineItemsTotal = lineItems.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        return sum + qty * price;
    }, 0);

    return (
        <div className="px-4 sm:px-8 py-8 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#3A3A3A] mb-1">Invoices</h2>
                    <p className="text-[#505050]">Create and track invoices for your clients</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-[#FF7A00] text-white px-6 py-3 rounded-xl hover:bg-[#CC6200] transition duration-200 shadow-lg font-semibold whitespace-nowrap">
                    + New invoice
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF7A00]"/>
                    <p className="text-[#505050] mt-4">Loading invoices...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Couldn't load invoices</p>
                    <p>Please try refreshing the page.</p>
                </div>
            ) : !invoices || invoices.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-[#3A3A3A] mb-2">No invoices yet</h3>
                    <p className="text-[#505050] mb-6">Create your first invoice to get paid</p>
                    <button onClick={() => setShowModal(true)} className="bg-[#FF7A00] text-white px-8 py-3 rounded-xl hover:bg-[#CC6200] transition duration-200 shadow-lg font-semibold">
                        Create your first invoice
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-160">
                            <thead className="bg-[#F0F0F0] border-b border-[#DAD8D9]">
                                <tr>
                                    <th className="px-6 py-3 text-sm font-semibold text-[#505050]">Invoice</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-[#505050]">Client</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-[#505050]">Due Date</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-[#505050]">Status</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-[#505050] text-right">Total</th>
                                </tr>
                            </thead>

                            <tbody>
                                {invoices.map((invoice) => {
                                    const total = invoice.lineItems.reduce(
                                        (sum, item) => sum + Number (item.quantity) * Number(item.unitPrice),
                                        0,
                                    );
                                    return (
                                        <tr key={invoice.id} className="border-b border-[#DAD8D9] last:border-0 hover:bg-[#F0F0F0] transition duration-200">
                                            <td className="px-6 py-4">
                                                <Link to={`/invoices/${invoice.id}`} className="text-[#FF7A00] hover:text-[#CC6200] font-semibold hover:underline">
                                                    {invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-[#3A3A3A]">{invoice.client.name}</td>
                                            <td className="px-6 py-4 text-[#505050] text-sm">{formatDate(invoice.dueDate)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles[invoice.status]}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-[#3A3A3A]">{formatCurrency(total)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50 py-8">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-[#3A3A3A] mb-6">New invoice</h3>

                        {formError && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                                <p>{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Client *</label>
                                    <select
                                        value={clientId}
                                        onChange={(e) => setClientId(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200 custom-select">
                                            <option value="">Select a client</option>
                                            {clients?.map((client) => (
                                                <option key={client.id} value={client.id}>{client.name}</option>
                                            ))}
                                    </select>
                                    {clients?.length === 0 && (
                                        <p className="text-sm text-[#909090] mt-1">Add a client first before creating an invoice.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Due date *</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                    <label className="block text-[#3A3A3A] text-sm font-bold">Line items *</label>
                                    <button
                                        type="button"
                                        onClick={addLineItem}
                                        className="text-sm font-semibold text-[#FF7A00] hover:text-[#CC6200] hover:underline whitespace-nowrap">
                                            + Add line item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {lineItems.map((item, index) => (
                                        <div key={index} className="flex flex-wrap sm:flex-nowrap gap-2 items-start">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                placeholder="Description"
                                                required
                                                className="flex-1 min-w-30 px-3 py-2 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                                            />
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                                                placeholder="Qty"
                                                min="1"
                                                step="1"
                                                required
                                                className="w-20 min-w-15 px-3 py-2 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                                            />
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                                                placeholder="Price"
                                                min="0"
                                                step="0.01"
                                                required
                                                className="w-28 min-w-20 px-3 py-2 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeLineItem(index)}
                                                disabled={lineItems.length === 1}
                                                className="px-3 py-2 text-[#FF3333] disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                                                aria-label="Remove line item">
                                                    ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-right mt-3 pt-3 border-t border-[#DAD8D9]">
                                    <span className="text-sm text-[#909090] mr-2">Total</span>
                                    <span className="font-bold text-[#3A3A3A]">{formatCurrency(lineItemsTotal)}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 bg-[#DAD8D9] text-[#505050] font-bold py-3 px-4 rounded-xl hover:bg-[#B5B4B5] transition duration-200">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 transition duration-200 shadow-lg">
                                    {createMutation.isPending ? 'Creating...' : 'Create invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Invoices;
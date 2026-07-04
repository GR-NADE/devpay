import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient, updateClient, deleteClient } from '../lib/api';
import type { AxiosError } from 'axios';
import type { ApiError, Client } from '../types';

const emptyForm = { name: '', email: '', company: '', billingAddress: '' };

const Clients = () => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const queryClient = useQueryClient();

    const { data: clients, isLoading, isError } = useQuery({
        queryKey: ['clients'],
        queryFn: getClients,
    });

    const createMutation = useMutation({
        mutationFn: createClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            closeModal();
        },
        onError: (err: AxiosError<ApiError>) => {
            setFormError(err.response?.data?.error || 'Failed to create client');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<typeof emptyForm> }) =>
            updateClient(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            closeModal();
        },
        onError: (err: AxiosError<ApiError>) => {
            setFormError(err.response?.data?.error || 'Failed to update client');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteClient,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });

    const handleChange = (field: keyof typeof emptyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        setFormError('');
        createMutation.mutate({
            name: form.name,
            email: form.email,
            company: form.company || undefined,
            billingAddress: form.billingAddress || undefined,
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        setFormError('');
        if (!editingClient) return;

        updateMutation.mutate({
            id: editingClient.id,
            data: {
                name: form.name,
                email: form.email,
                company: form.company || undefined,
                billingAddress: form.billingAddress || undefined,
            },
        });
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setForm({
            name: client.name,
            email: client.email,
            company: client.company || '',
            billingAddress: client.billingAddress || '',
        });
        setFormError('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Delete this client? This cannot be undone.'))
        {
            deleteMutation.mutate(id);
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setEditingClient(null);
        setForm(emptyForm);
        setFormError('');
    };

    const isModalOpen = showCreateModal || !!editingClient;
    const isEditing = !!editingClient;
    const isPending = isEditing ? updateMutation.isPending : createMutation.isPending;

    const ClientForm = (
        <form onSubmit={isEditing ? handleEditSubmit : handleCreateSubmit} className="space-y-4">
            <div>
                <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Name *</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                />
            </div>

            <div>
                <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Email *</label>
                <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                />
            </div>

            <div>
                <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Company</label>
                <input
                    type="text"
                    value={form.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                />
            </div>

            <div>
                <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Billing address</label>
                <textarea
                    value={form.billingAddress}
                    onChange={(e) => handleChange('billingAddress', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200 resize-none"
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 bg-[#DAD8D9] text-[#505050] font-bold py-3 px-4 rounded-xl hover:bg-[#B5B4B5] transition duration-200">
                    Cancel
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 transition duration-200 shadow-lg">
                    {isPending
                        ? isEditing ? 'Saving...' : 'Adding...'
                        : isEditing ? 'Save changes' : 'Add client'
                    }
                </button>
            </div>
        </form>
    );

    return (
        <div className="px-4 sm:px-8 py-8 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#3A3A3A] mb-1">Clients</h2>
                    <p className="text-[#505050]">Manage the people and companies you invoice</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="bg-[#FF7A00] text-white px-6 py-3 rounded-xl hover:bg-[#CC6200] transition duration-200 shadow-lg font-semibold whitespace-nowrap">
                    + Add client
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF7A00]"/>
                    <p className="text-[#505050] mt-4">Loading clients...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Couldn't load clients</p>
                    <p>Please try refreshing the page.</p>
                </div>
            ) : !clients || clients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-lg">
                    <h3 className="text-2xl font-bold text-[#3A3A3A] mb-2">No clients yet</h3>
                    <p className="text-[#505050] mb-6">Add your first client to start invoicing</p>
                    <button onClick={() => setShowCreateModal(true)} className="bg-[#FF7A00] text-white px-8 py-3 rounded-xl hover:bg-[#CC6200] transition duration-200 shadow-lg font-semibold">
                        Add your first client
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {clients.map((client) => (
                        <div key={client.id} className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-[#3A3A3A] truncate">{client.name}</h3>
                            {client.company && (
                                <p className="text-sm text-[#909090] mb-2">{client.company}</p>
                            )}
                            <p className="text-sm text-[#505050] truncate">{client.email}</p>
                            {client.billingAddress && (
                                <p className="text-sm text-[#505050] mt-1 truncate">{client.billingAddress}</p>
                            )}
                            <div className="mt-4 pt-4 border-t border-[#DAD8D9] flex gap-4">
                                <button
                                    onClick={() => openEditModal(client)}
                                    className="text-sm font-semibold text-[#FF7A00] hover:underline transition duration-200">
                                        Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    disabled={deleteMutation.isPending && deleteMutation.variables === client.id}
                                    className="text-sm font-semibold text-[#FF3333] hover:underline disabled:opacity-50 transition duration-200">
                                        {deleteMutation.isPending && deleteMutation.variables === client.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
                        <h3 className="text-2xl font-bold text-[#3A3A3A] mb-6">
                            {isEditing ? 'Edit client' : 'Add client'}
                        </h3>

                        {formError && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                                <p>{formError}</p>
                            </div>
                        )}

                        {ClientForm}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;
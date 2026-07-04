import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getSettings, getBanks, resolveAccount, connectBank } from '../lib/api';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

const Settings = () => {
    const [selectedBankCode, setSelectedBankCode] = useState('');
    const [selectedBankName, setSelectedBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [resolvedAccount, setResolvedAccount] = useState<{ account_name: string } | null>(null);
    const [resolveError, setResolveError] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formError, setFormError] = useState('');

    const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings,
    });

    const { data: banks, isLoading: banksLoading } = useQuery({
        queryKey: ['banks'],
        queryFn: getBanks,
    });

    const connectMutation = useMutation({
        mutationFn: connectBank,
        onSuccess: () => {
            setSuccessMessage('Bank account connected successfully');
            setResolvedAccount(null);
            setAccountNumber('');
            setSelectedBankCode('');
            setSelectedBankName('');
            refetchSettings();
        },
        onError: (err: AxiosError<ApiError>) => {
            setFormError(err.response?.data?.error || 'Failed to connect bank account');
        },
    });

    const handleBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const code = e.target.value;
        const bank = banks?.find((b) => b.code === code);
        setSelectedBankCode(code);
        setSelectedBankName(bank?.name || '');
        setResolvedAccount(null);
        setResolveError('');
    };

    const handleAccountNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setAccountNumber(value);
        setResolvedAccount(null);
        setResolveError('');

        if (value.length === 10 && selectedBankCode)
        {
            setIsResolving(true);
            try
            {
                const resolved = await resolveAccount(value, selectedBankCode);
                setResolvedAccount(resolved);
            }
            catch
            {
                setResolveError('Could not verify this account number. Please check and try again.');
            }
            finally
            {
                setIsResolving(false);
            }
        }
    };

    const handleSubmit = () => {
        setFormError('');
        setSuccessMessage('');

        if (!selectedBankCode || !accountNumber || !resolvedAccount)
        {
            setFormError('Please select a bank, enter your account number, and verify it first');
            return;
        }

        connectMutation.mutate({
            bankCode: selectedBankCode,
            bankName: selectedBankName,
            accountNumber,
            accountName: resolvedAccount.account_name,
        });
    };

    if (settingsLoading)
    {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF7A00]"/>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-8 py-8 max-w-3xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#3A3A3A] mb-1">Settings</h2>
                <p className="text-[#505050]">Manage your account and payment details</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-bold text-[#3A3A3A] mb-4">Account</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
                        <span className="text-[#909090]">Name</span>
                        <span className="font-semibold text-[#3A3A3A] wrap-break-word">{settings?.name}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
                        <span className="text-[#909090]">Email</span>
                        <span className="text-[#3A3A3A] wrap-break-word">{settings?.email}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-lg font-bold text-[#3A3A3A] mb-1">Payment account</h3>
                <p className="text-sm text-[#505050] mb-6">
                    Connect your bank account to receive payments from clients directly.
                </p>

                {settings?.bankConnected ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                        <p className="font-semibold text-green-700 mb-1">Bank account connected</p>
                        <p className="text-sm text-[#505050] wrap-break-word">{settings.accountName}</p>
                        <p className="text-sm text-[#505050]">{settings.bankName} — ••••{settings.accountNumber?.slice(-4)}</p>
                    </div>
                ) : (
                    <div className="bg-[#FFF8E7] border border-yellow-200 rounded-xl p-4 mb-6">
                        <p className="font-semibold text-yellow-800 mb-1">No bank account connected</p>
                        <p className="text-sm text-yellow-700">Client payments won't be routed to you until you connect a bank account.</p>
                    </div>
                )}

                {successMessage && (
                    <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6">
                        <p>{successMessage}</p>
                    </div>
                )}

                {formError && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p>{formError}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Bank</label>
                        <select
                            value={selectedBankCode}
                            onChange={handleBankChange}
                            disabled={banksLoading}
                            className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed custom-select">
                                <option value="">{banksLoading ? 'Loading banks...' : 'Select your bank'}</option>
                                {banks?.map((bank) => (
                                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                                ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Account number</label>
                        <input
                            type="text"
                            value={accountNumber}
                            onChange={handleAccountNumberChange}
                            maxLength={10}
                            disabled={!selectedBankCode}
                            className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {isResolving && (
                            <p className="text-sm text-[#909090] mt-2">Verifying account...</p>
                        )}
                        {resolvedAccount && (
                            <div className="mt-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                                <p className="text-sm font-semibold text-green-700">Account verified</p>
                                <p className="text-sm text-[#3A3A3A] wrap-break-word">{resolvedAccount.account_name}</p>
                            </div>
                        )}
                        {resolveError && (
                            <p className="text-sm text-red-500 mt-2">{resolveError}</p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!resolvedAccount || connectMutation.isPending}
                        className="w-full bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg">
                            {connectMutation.isPending ? 'Connecting...' : settings?.bankConnected ? 'Update bank account' : 'Connect bank account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
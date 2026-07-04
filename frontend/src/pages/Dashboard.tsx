import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getSettings } from '../lib/api';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const statusLabels: Record<string, string> = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
};

const statusColors: Record<string, string> = {
    DRAFT: 'border-[#DAD8D9]',
    SENT: 'border-blue-400',
    PAID: 'border-green-400',
    OVERDUE: 'border-red-400',
};

const Dashboard = () => {
    const navigate = useNavigate();

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: getDashboardStats,
    });

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings,
    })

    return (
        <div className="px-4 sm:px-8 py-8 max-w-6xl">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#3A3A3A] mb-1">Dashboard</h2>
                <p className="text-[#505050]">An overview of your invoicing activity</p>
            </div>

            {settings && !settings.bankConnected && (
                <div className="bg-[#FFF8E7] border border-yellow-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-yellow-800">Connect your bank account</p>
                        <p className="text-sm text-yellow-700 mt-0.5">
                            Add your bank details so client payments go directly to you.
                        </p>
                    </div>
                    <button onClick={() => navigate('/settings')} className="bg-[#FF7A00] text-white px-4 py-2 rounded-xl hover:bg-[#CC6200] transition duration-200 font-semibold text-sm shadow-lg whitespace-nowrap">
                        Connect now
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF7A00]"/>
                    <p className="text-[#505050] mt-4">Loading dashboard...</p>
                </div>
            ) : isError ? (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Couldn't load dashboard data</p>
                    <p>Please try refreshing the page.</p>
                </div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-400 min-w-0">
                            <p className="text-sm text-[#909090]">Total revenue</p>
                            <p className="text-3xl font-bold text-[#3A3A3A] mt-1 wrap-break-word overflow-wrap-anywhere">{formatCurrency(stats.totalRevenue)}</p>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-400 min-w-0">
                            <p className="text-sm text-[#909090]">Outstanding balance</p>
                            <p className="text-3xl font-bold text-[#3A3A3A] mt-1 wrap-break-word overflow-wrap-anywhere">{formatCurrency(stats.outstandingBalance)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-[#3A3A3A] mb-4">Invoices by status</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => (
                                <div key={status} className={`bg-[#F0F0F0] rounded-xl p-3 sm:p-4 border-l-4 ${statusColors[status]}`}>
                                    <p className="text-xs sm:text-sm text-[#909090]">{statusLabels[status]}</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#3A3A3A] mt-1 wrap-break-word">{stats.invoiceCounts[status as keyof typeof stats.invoiceCounts]}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-[#909090] mt-4">{stats.totalInvoices} total invoices</p>
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default Dashboard;
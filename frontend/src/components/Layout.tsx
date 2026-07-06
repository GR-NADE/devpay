import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#F0F0F0]">
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-[#DAD8D9] hover:bg-[#F0F0F0] transition duration-200"
                aria-label="Toggle sidebar">
                    <svg className="w-6 h-6 text-[#3A3A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
            </button>

            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} />
            )}

            <div className={`
                    fixed lg:sticky top-0 left-0 z-50 h-screen
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:translate-x-0
                `}>
                    <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            <main className="flex-1 min-w-0 pt-16 lg:pt-0">
                <Outlet/>
            </main>
        </div>
    );
};

export default Layout;
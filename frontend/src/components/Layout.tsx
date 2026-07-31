import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#F0F0F0]">
            <div className="lg:hidden fixed top-0 left-0 z-40 h-16 w-full bg-[#F0F0F0]">
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden fixed top-4 left-1 z-50 p-2 rounded-lg hover:bg-[#E8E8E8] transition duration-200"
                    aria-label="Toggle sidebar">
                        <svg className="w-8 h-8 text-[#3A3A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                </button>
            </div>

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
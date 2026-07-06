import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/clients', label: 'Clients' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/settings', label: 'Settings' },
];

interface SidebarProps {
    onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className="w-64 sm:w-72 lg:w-64 h-full bg-white border-r border-[#DAD8D9] flex flex-col overflow-y-auto">
            <div className="px-6 py-6 border-b border-[#DAD8D9] flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#FF7A00]">DevPay</h1>
                <button onClick={onClose} className="lg:hidden p-1 hover:bg-[#F0F0F0] rounded-lg transition duration-200" aria-label="Close sidebar">
                    <svg className="w-6 h-6 text-[#3A3A3A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleLinkClick}
                        className={({ isActive }) => 
                            `block px-4 py-2.5 rounded-xl font-semibold text-sm transition duration-200 ${
                                isActive
                                ? 'bg-[#FF7A00] text-white'
                                : 'text-[#505050] hover:bg-[#FFF0E0]'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="px-4 py-6 border-t border-[#DAD8D9]">
                <div className="px-4 mb-3">
                    <p className="text-sm font-semibold text-[#3A3A3A] truncate">{user?.name}</p>
                    <p className="text-xs text-[#909090] truncate">{user?.email}</p>
                </div>

                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl font-semibold text-sm text-[#FF3333] bg-[#FFEBEB] hover:bg-[#FFDADA] transition duration-200">
                    Log Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/clients', label: 'Clients' },
    { to: '/invoices', label: 'Invoices' },
    { to: '/settings', label: 'Settings' },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="min-h-screen bg-white border-r border-[#DAD8D9] flex flex-col w-50 sm:w-55 md:w-60 lg:w-[256px] xl:w-70 2xl:w-[320px] shrink-0">
            <div className="px-4 sm:px-5 md:px-6 py-4 sm:py-5 md:py-6 border-b border-[#DAD8D9]">
                <h1 className="text-xl sm:text-2xl md:text-2xl font-bold text-[#FF7A00] truncate">DevPay</h1>
            </div>

            <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => 
                            `block px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition duration-200 ${
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

            <div className="px-3 sm:px-4 py-4 sm:py-6 border-t border-[#DAD8D9]">
                <div className="px-2 sm:px-4 mb-2 sm:mb-3">
                    <p className="text-xs sm:text-sm font-semibold text-[#3A3A3A] truncate">{user?.name}</p>
                    <p className="text-[10px] sm:text-xs text-[#909090] truncate">{user?.email}</p>
                </div>

                <button onClick={handleLogout} className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-[#FF3333] bg-[#FFEBEB] hover:bg-[#FFDADA] transition duration-200">
                    Log Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex min-h-screen bg-[#F0F0F0]">
            <Sidebar/>
            <main className="flex-1 min-w-0">
                <Outlet/>
            </main>
        </div>
    );
};

export default Layout;
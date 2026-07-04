import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading)
    {
        return null;
    }

    if (!isAuthenticated)
    {
        return <Navigate to = "/login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
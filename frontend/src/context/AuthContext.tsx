import { useState, type ReactNode } from 'react';
import type { User } from '../types';
import { logoutUser } from '../lib/api';
import { AuthContext } from './AuthContextDefinition';

const getStoredUser = (): User | null => {
    const storedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('accessToken');

    if (storedUser && accessToken)
    {
        return JSON.parse(storedUser);
    }

    return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(getStoredUser);
    const isLoading = false;

    const login = (userData: User, accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        const refreshToken = localStorage.getItem('refreshToken');

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);

        if (refreshToken)
        {
            logoutUser(refreshToken).catch(() => {

            });
        }
    };

    return (
        <AuthContext.Provider value = {{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
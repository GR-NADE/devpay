import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../lib/api';
import { useAuth } from '../context/useAuth';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try
        {
            const response = await loginUser({ email, password });
            login(response.user, response.accessToken, response.refreshToken);
            navigate('/dashboard');
        }
        catch (err)
        {
            const axiosError = err as AxiosError<ApiError>;
            setError(axiosError.response?.data?.error || 'Login failed');
        }
        finally
        {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white pb-12">
            <div className="p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#FF7A00] mb-2">DevPay</h1>
                    <h2 className="text-2xl font-semibold text-[#3A3A3A]">Welcome back</h2>
                    <p className="text-[#505050] mt-2">Log in to manage your invoices</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Email address</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your email"
                            className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-[#3A3A3A] text-sm font-bold">Password</label>
                            <Link to="/forgot-password" className="text-sm text-[#FF7A00] hover:text-[#CC6200] hover:underline transition duration-200">
                            Forgot password?</Link>
                        </div>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                            autoComplete="off"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg">
                            {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[#505050]">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-[#FF7A00] hover:text-[#CC6200] font-semibold hover:underline transition duration-200">
                            Create one now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
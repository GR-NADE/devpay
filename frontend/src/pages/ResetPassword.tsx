import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../lib/api';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

const ResetPassword = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8)
        {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/[a-zA-Z]/.test(password))
        {
            setError('Password must contain at least one letter');
            return;
        }

        if (!/[0-9]/.test(password))
        {
            setError('Password must contain at least one number');
            return;
        }

        if (password !== confirmPassword)
        {
            setError('Passwords do not match');
            return;
        }

        if (!token)
        {
            setError('Invalid reset link');
            return;
        }

        setLoading(true);

        try
        {
            await resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        }
        catch (err)
        {
            const axiosError = err as AxiosError<ApiError>;
            setError(axiosError.response?.data?.error || 'Failed to reset password. The link may have expired.');
        }
        finally
        {
            setLoading(false);
        }
    };

    if (success)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white pb-12">
                <div className="p-8 w-full max-w-md text-center">
                    <h1 className="text-3xl font-bold text-[#FF7A00] mb-6">DevPay</h1>
                    <div className="bg-green-50 rounded-xl p-6">
                        <p className="text-green-700 font-semibold text-lg mb-2">Password reset successfully</p>
                        <p className="text-[#505050]">Redirecting you to login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white pb-12">
            <div className="p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#FF7A00] mb-2">DevPay</h1>
                    <h2 className="text-2xl font-semibold text-[#3A3A3A]">Set new password</h2>
                    <p className="text-[#505050] mt-2">Choose a strong password for your account</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">New password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="At least 8 characters, letters and numbers"
                            className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                            autoComplete="off"
                        />
                    </div>

                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Confirm new password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Re-enter your new password"
                           className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                           autoComplete="off" 
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg">
                        {loading ? 'Resetting...' : 'Reset password'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-[#FF7A00] hover:text-[#CC6200] font-semibold hover:underline transition duration-200">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
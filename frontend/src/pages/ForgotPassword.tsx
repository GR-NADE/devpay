import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../lib/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try
        {
            await requestPasswordReset(email);
        }
        finally
        {
            setLoading(false);
            setSubmitted(true);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white pb-12">
            <div className="p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#FF7A00] mb-2">DevPay</h1>
                    <h2 className="text-2xl font-semibold text-[#3A3A3A]">Reset your password</h2>
                    <p className="text-[#505050] mt-2">
                        {submitted
                        ? "Check your inbox for a reset link."
                        : "Enter your email and we'll send you a reset link."}
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-[#F0F0F0] rounded-xl p-6 text-center">
                        <p className="text-[#3A3A3A]">
                            If an account with that email exists, a password reset link has been sent.
                            The link expires in 30 minutes.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                className="w-full px-4 py-3 border border-[#DAD8D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200"
                                autoComplete="off"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg">
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-[#FF7A00] hover:text-[#CC6200] font-semibold hover:underline transition duration-200">
                    Back to login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
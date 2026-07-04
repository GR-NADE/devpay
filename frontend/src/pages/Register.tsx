import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { registerUser } from '../lib/api';
import type { AxiosError } from 'axios';

interface FieldErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const clearFieldError = (field: keyof FieldErrors) => {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = () : boolean => {
        const errors: FieldErrors = {};

        if (name.trim().length < 2)
        {
            errors.name = 'Name must be at least 2 characters';
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        {
            errors.email = 'Enter a valid email address';
        }

        if (password.length < 8)
        {
            errors.password = 'Password must be at least 8 characters';
        }
        else if (!/[a-zA-Z]/.test(password))
        {
            errors.password = 'Password must contain at least one letter';
        }
        else if (!/[0-9]/.test(password))
        {
            errors.password = 'Password must contain at least one number';
        }

        if (password !== confirmPassword)
        {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        setLoading(true);

        try
        {
            await registerUser({ name, email, password });
            setSubmitted(true);
        }
        catch (err)
        {
            const axiosError = err as AxiosError<{ error?: string }>;
            const message = axiosError.response?.data?.error || 'Registration failed. Please try again.';

            if (message.toLowerCase().includes('email'))
            {
                setFieldErrors((prev) => ({ ...prev, email: message }));
            }
            else if (message.toLowerCase().includes('password'))
            {
                setFieldErrors((prev) => ({ ...prev, password: message }));
            }
            else if (message.toLowerCase().includes('name'))
            {
                setFieldErrors((prev) => ({ ...prev, name: message }));
            }
            else
            {
                setError(message);
            }
        }
        finally
        {
            setLoading(false);
        }
    };

    const inputClass = (field: keyof FieldErrors) => 
        `w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent transition duration-200 ${
            fieldErrors[field] ? 'border-red-500' : 'border-[#DAD8D9]'
        }`;

    if (submitted)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white pb-12">
                <div className="p-8 w-full max-w-md text-center">
                    <h1 className="text-3xl font-bold text-[#FF7A00] mb-6">DevPay</h1>
                    <div className="bg-[#F0F0F0] rounded-xl p-8">
                        <h2 className="text-2xl font-bold text-[#3A3A3A] mb-3">Check your inbox</h2>
                        <p className="text-[#505050] mb-2">
                            We've sent a verification link to <strong>{email}</strong>.
                        </p>
                        <p className="text-[#505050]">
                            Click the link in the email to activate your account. It expires in 24 hours.
                        </p>
                    </div>
                    <div className="mt-6">
                        <Link to="/login" className="text-[#FF7A00] hover:text-[#CC6200] font-semibold hover:underline transition duration-200">
                            Back to login
                        </Link>
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
                    <h2 className="text-2xl font-semibold text-[#3A3A3A]">Create account</h2>
                    <p className="text-[#505050] mt-2">Start invoicing your clients</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); clearFieldError('name'); }}
                            required
                            placeholder="Your full name"
                            className={inputClass('name')}
                            autoComplete="off"
                        />
                        {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                            required
                            placeholder="Enter your email"
                            className={inputClass('email')}
                            autoComplete="off"
                        />
                        {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                            required
                            placeholder="At least 8 characters, letters and numbers"
                            className={inputClass('password')}
                            autoComplete="off"
                        />
                        {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-[#3A3A3A] text-sm font-bold mb-2">Confirm password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                            required
                            placeholder="Re-enter your password"
                            className={inputClass('confirmPassword')}
                            autoComplete="off"
                        />
                        {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FF7A00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#CC6200] disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg">
                            {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-[#505050]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#FF7A00] hover:text-[#CC6200] font-semibold hover:underline transition duration-200">
                            Log in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
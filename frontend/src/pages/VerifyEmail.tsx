import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../lib/api';

const VerifyEmail = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');
    const hasVerified = useRef(false);

    useEffect(() => {
        if (!hasVerified.current && token)
        {
            hasVerified.current = true;
            verifyEmail(token)
                .then((data) => {
                    setStatus('success');
                    setMessage(data.message);
                    setTimeout(() => navigate('/login'), 3000);
                })
                .catch((err) => {
                    setStatus('error');
                    setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
                });
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0]">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                <h1 className="text-2xl font-bold text-[#FF7A00] mb-6">DevPay</h1>

                {status === 'verifying' && (
                    <>
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mb-4"/>
                        <h2 className="text-xl font-bold text-[#3A3A3A]">Verifying your email...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2 className="text-xl font-bold text-green-600 mb-2">Email verified!</h2>
                        <p className="text-[#505050]">{message}</p>
                        <p className="text-sm text-[#909090] mt-4">Redirecting you to login...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <h2 className="text-xl font-bold text-[#FF3333] mb-2">Verification failed</h2>
                        <p className="text-[#505050] mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-[#FF7A00] text-white px-6 py-2 rounded-xl hover:bg-[#CC6200] transition duration-200 font-semibold">
                                Back to register
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
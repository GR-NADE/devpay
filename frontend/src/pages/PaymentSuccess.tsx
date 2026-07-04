import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const PaymentSuccess = () => {
    const { token } = useParams<{ token: string }>();
    const [show, setShow] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center px-4">
            <div className="bg-white rounded-xl shadow-lg p-12 max-w-md w-full text-center">
                <div className="flex items-center justify-center mb-6">
                    <div
                        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                        style={{
                            transform: show ? 'scale(1)' : 'scale(0)',
                            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        }}>
                            <svg
                                viewBox="0 0 52 52"
                                className="w-10 h-10"
                                style={{
                                    strokeDasharray: 60,
                                    strokeDashoffset: show ? 0 : 60,
                                    transition: 'stroke-dashoffset 0.5s ease 0.3s',
                                }}>
                                    <path fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"strokeLinejoin="round" d="M14 27 L22 35 L38 19"/>
                            </svg>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-[#3A3A3A] mb-2">Payment successful</h2>
                <p className="text-[#505050] mb-8">
                    Your payment has been received. You'll get a confirmation email shortly.
                </p>

                {token && (
                    <Link to={`/pay/${token}`}
                    className="text-[#FF7A00] hover:text-[#CC6200] hover:underline font-semibold text-sm transition duration-200">
                        View invoice
                    </Link>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
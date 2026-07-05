import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || 'DevPay <onboarding@resend.dev>';

if (process.env.NODE_ENV === 'production' && FROM.includes('onboarding@resend.dev'))
{
    console.error('WARNING: Using Resend sandbox email in production! Set RESEND_FROM_EMAIL.');
}

export const sendVerificationEmail = async (
    email: string,
    name: string,
    token: string,
) : Promise<void> => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email/${token}`;

    console.log(`[email] Sending verification email to ${email} from ${FROM}`);

    try
    {
        const result = await resend.emails.send({
            from: FROM,
            to: email,
            subject: 'Verify your DevPay account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #3A3A3A;">
                    <h2 style="color: #FF7A00;">Welcome to DevPay!</h2>
                    <p>Hi ${name},</p>
                    <p>Thanks for signing up. Please verify your email address to activate your account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verifyUrl}" style="background-color: #FF7A00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                            Verify Email Address
                        </a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #505050; word-break: break-all;">${verifyUrl}</p>
                    <p>This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #DAD8D9;">
                    <p style="color: #909090; font-size: 12px;">DevPay — Invoicing for freelancers</p>
                </div>
            `,
        });

        console.log(`[email] Verification email result:`, JSON.stringify(result));
    }
    catch (err)
    {
        console.error(`[email] Failed to send verification email:`, err);
        throw err;
    }
};

export const sendPasswordResetEmail = async (
    email: string,
    name: string,
    resetUrl: string,
) : Promise<void> => {
    await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Reset your DevPay password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #3A3A3A;">
                <h2 style="color: #FF7A00;">Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>We received a request to reset your DevPay password. Click the button below — this link expires in 30 minutes:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #FF7A00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #505050; word-break: break-all;">${resetUrl}</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #DAD8D9;">
                <p style="color: #909090; font-size: 12px;">DevPay — Invoicing for freelancers</p>
            </div>
        `,
    });
};

export const sendInvoiceSentEmail = async (
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
    paymentUrl: string,
    totalAmount: string,
) : Promise<void> => {
    await resend.emails.send({
        from: FROM,
        to: clientEmail,
        subject: `Invoice ${invoiceNumber} — Payment due`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #3A3A3A;">
                <h2 style="color: #FF7A00;">Invoice ${invoiceNumber}</h2>
                <p>Hi ${clientName},</p>
                <p>You have received an invoice for <strong>${totalAmount}</strong>. Please click the button below to view and pay it:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${paymentUrl}" style="background-color: #FF7A00; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                        View &amp; Pay Invoice
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #505050; word-break: break-all;">${paymentUrl}</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #DAD8D9;">
                <p style="color: #909090; font-size: 12px;">DevPay — Invoicing for freelancers</p>
            </div>
        `,
    });
};

export const sendPaymentConfirmationEmail = async (
    clientEmail: string,
    clientName: string,
    invoiceNumber: string,
) : Promise<void> => {
    await resend.emails.send({
        from: FROM,
        to: clientEmail,
        subject: `Payment received — Invoice ${invoiceNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #3A3A3A;">
                <h2 style="color: #22c55e;">Payment Received</h2>
                <p>Hi ${clientName},</p>
                <p>We've received your payment for invoice <strong>${invoiceNumber}</strong>. Thank you!</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #DAD8D9;">
                <p style="color: #909090; font-size: 12px;">DevPay — Invoicing for freelancers</p>
            </div>
        `,
    });
};
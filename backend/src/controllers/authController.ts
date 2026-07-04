import { Request, Response, NextFunction } from 'express';
import dns from 'dns';
import crypto from 'crypto';
import { prisma } from '../prisma/client';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    generatePasswordResetToken,
    PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
} from '../services/authService';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService';

const dnsPromises = dns.promises;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

const verifyEmailDomain = async (email: string) : Promise<boolean> => {
    try
    {
        const domain = email.split('@')[1];
        const mxRecords = await dnsPromises.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) return false;

        try
        {
            await dnsPromises.resolve4(domain);
        }
        catch
        {
            try
            {
                await dnsPromises.resolve6(domain);
            }
            catch
            {
                return false;
            }
        }

        return true;
    }
    catch
    {
        return false;
    }
};

export const register = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const { email, password, name } = req.body;

        if (!email || !password || !name)
        {
            res.status(400).json({ error: 'Email, password, and name are required' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
        {
            res.status(400).json({ error: 'Invalid email address format' });
            return;
        }

        if (password.length < 8)
        {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        if (!/[a-zA-Z]/.test(password))
        {
            res.status(400).json({ error: 'Password must contain at least one letter' });
            return;
        }

        if (!/[0-9]/.test(password))
        {
            res.status(400).json({ error: 'Password must contain at least one number' });
            return;
        }

        if (process.env.SKIP_DNS_VALIDATION !== 'true')
        {
            const domainValid = await verifyEmailDomain(email);
            if (!domainValid)
            {
                res.status(400).json({ error: 'Email domain does not exist' });
                return;
            }
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
        {
            res.status(409).json({ error: 'Email already in use' });
            return;
        }

        const existingPending = await prisma.pendingVerification.findUnique({ where: { email } });
        if (existingPending)
        {
            if (existingPending.expiresAt > new Date())
            {
                res.status(409).json({
                    error: 'A verification email has already been sent. Please check your inbox or wait for it to expire before trying again.',
                });
                return;
            }

            await prisma.pendingVerification.delete({ where: { email } });
        }

        const passwordHash = await hashPassword(password);
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

        await prisma.pendingVerification.create({
            data: { email, name, passwordHash, token, expiresAt }
        });

        await sendVerificationEmail(email, name, token);

        res.status(201).json({
            message: 'Registration successful! Please check your email to verify your account.',
        });
    }
    catch (err)
    {
        next(err);
    }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const token = String(req.params.token);

        const pending = await prisma.pendingVerification.findUnique({ where: { token } });

        if (!pending || pending.expiresAt < new Date())
        {
            res.status(400).json({ error: 'Invalid or expired verification token' });
            return;
        }

        await prisma.user.create({
            data: {
                email: pending.email,
                name: pending.name,
                passwordHash: pending.passwordHash,
            },
        });

        await prisma.pendingVerification.delete({ where: { token } });

        res.json({ message: 'Email verified successfully! You can now log in.' });
    }
    catch (err)
    {
        next(err);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const { email, password } = req.body;

        if (!email || !password)
        {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
        {
            const pending = await prisma.pendingVerification.findUnique({ where: { email } });
            if (pending && pending.expiresAt > new Date())
            {
                res.status(401).json({ error: 'Please verify your email before logging in. Check your inbox.' });
                return;
            }
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const valid = await comparePassword(password, user.passwordHash);
        if (!valid)
        {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const accessToken = generateAccessToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken();
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

        await prisma.refreshToken.create({
            data: { userId: user.id, tokenHash, expiresAt },
        });
        
        res.json({
            accessToken,
            refreshToken,
            user: { id: user.id, email: user.email, name: user.name },
        });
    }
    catch (err)
    {
        next(err);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const { refreshToken } = req.body;

        if (!refreshToken)
        {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        const tokenHash = hashToken(refreshToken);
        const stored = await prisma.refreshToken.findFirst({
            where: { tokenHash },
            include: { user: true },
        });

        if (!stored || stored.expiresAt < new Date())
        {
            res.status(401).json({ error: 'Invalid or expired refresh token' });
            return;
        }

        await prisma.refreshToken.delete({ where: { id: stored.id } });

        const newAccessToken = generateAccessToken({
            userId: stored.user.id,
            email: stored.user.email,
        });

        const newRefreshToken = generateRefreshToken();
        const newTokenHash = hashToken(newRefreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

        await prisma.refreshToken.create({
            data: { userId: stored.user.id, tokenHash: newTokenHash, expiresAt },
        });

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    }
    catch (err)
    {
        next(err);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const { refreshToken } = req.body;

        if (!refreshToken)
        {
            res.status(400).json({ error: 'Refresh token is required' });
            return;
        }

        const tokenHash = hashToken(refreshToken);
        await prisma.refreshToken.deleteMany({ where: { tokenHash } });

        res.json({ message: 'Logged out successfully' });
    }
    catch (err)
    {
        next(err);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const { email } = req.body;

        if (!email)
        {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (user)
        {
            const resetToken = generatePasswordResetToken();
            const tokenHash = hashToken(resetToken);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_TOKEN_EXPIRY_MINUTES);

            await prisma.passwordResetToken.create({
                data: { userId: user.id, tokenHash, expiresAt },
            });

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

            await sendPasswordResetEmail(user.email, user.name, resetUrl);
        }

        res.json({
            message: 'If an account with that email exists, a password reset link has been sent.',
        });
    }
    catch (err)
    {
        next(err);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
    try
    {
        const { token, password } = req.body;

        if (!token || !password)
        {
            res.status(400).json({ error: 'Token and password are required' });
            return;
        }

        if (password.length < 8)
        {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        const tokenHash = hashToken(token);
        const stored = await prisma.passwordResetToken.findFirst({
            where: { tokenHash },
            include: { user: true },
        });

        if (!stored || stored.used || stored.expiresAt < new Date())
        {
            res.status(401).json({ error: 'Invalid or expired reset token' });
            return;
        }

        const isSamePassword = await comparePassword(password, stored.user.passwordHash);
        if (isSamePassword)
        {
            res.status(400).json({ error: 'New password must be different from your current password' });
            return;
        }

        const passwordHash = await hashPassword(password);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: stored.userId },
                data: { passwordHash },
            }),
            prisma.passwordResetToken.update({
                where: { id: stored.id },
                data: { used: true },
            }),
            prisma.refreshToken.deleteMany({
                where: { userId: stored.userId },
            }),
        ]);

        res.json({ message: 'Password has been reset successfully. Please log in.' });
    }
    catch (err)
    {
        next(err);
    }
};
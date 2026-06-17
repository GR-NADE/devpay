import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashToken
} from '../services/authService';

const REFRESH_TOKEN_EXPIRY_DAYS = 7

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try
    {
        const { email, password, name } = req.body;

        if (!email || !password || !name)
        {
            res.status(400).json({ error: 'Email, password, and name are required' });
            return;
        }

        if (password.length < 8)
        {
            res.status(400).json({ error: 'Password must be at least 8 characters' });
            return;
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing)
        {
            res.status(409).json({ error: 'Email already in use' });
            return;
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: { email, passwordHash, name },
        });

        const accessToken = generateAccessToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken();
        const tokenHash = hashToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

        await prisma.refreshToken.create({
            data: { userId: user.id, tokenHash, expiresAt }
        });

        res.status(201).json({
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

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password)
    {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
    {
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
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
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
        data: { userId: stored.user.id, tokenHash: newTokenHash, expiresAt},
    });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    if (!refreshToken)
    {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
    }

    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });

    res.json({ message: 'Logged out successfully' });
};
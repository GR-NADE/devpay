import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import paymentRoutes from './routes/paystackRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { handleWebhook } from './controllers/paystackController';
import { generalLimiter } from './middleware/rateLimiter';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

app.use(
	express.json({
		verify: (req: Request & { rawBody?: string }, _res, buf) => {
			req.rawBody = buf.toString('utf8');
		},
	}),
);

app.post('/api/webhooks/paystack', handleWebhook);

app.use('/api', generalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err);
	res.status(500).json({ error: 'An unexpected error occurred' });
});

export default app;
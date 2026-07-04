import { Router } from 'express';
import { createPaymentSession, handleWebhook } from '../controllers/paystackController';

const router = Router();

router.post('/pay/:token', createPaymentSession);

export default router;
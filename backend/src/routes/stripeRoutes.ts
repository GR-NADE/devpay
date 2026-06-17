import { Router } from 'express';
import { createPaymentSession } from '../controllers/stripeController';

const router = Router();

router.post('/pay/:token', createPaymentSession);

export default router;
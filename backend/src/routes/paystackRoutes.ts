import { Router } from 'express';
import { createPaymentSession } from '../controllers/paystackController';

const router = Router();

router.post('/pay/:token', createPaymentSession);

export default router;
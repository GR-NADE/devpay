import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDashboard } from '../controllers/dashboardController';

const router = Router();

router.use(authenticate);
router.get('/', getDashboard);

export default router;
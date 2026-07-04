import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
    getSettings,
    listBanks,
    resolveAccountNumber,
    connectBank,
} from '../controllers/settingsController';

const router = Router();

router.use(authenticate);

router.get('/', getSettings);
router.get('/banks', listBanks);
router.get('/resolve-account', resolveAccountNumber);
router.post('/connect-bank', connectBank);

export default router;
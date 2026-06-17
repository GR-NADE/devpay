import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
    getInvoices,
    getInvoice,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getPublicInvoice,
} from '../controllers/invoiceController';

const router = Router();

router.get('/public/:token', getPublicInvoice);

router.use(authenticate);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
import { Router } from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { getActivityFeed, getRecentActivity } from '../controllers/activityController.js';

const router = Router();

router.use(protectAdmin);

router.get('/', getActivityFeed);
router.get('/recent', getRecentActivity);

export default router;



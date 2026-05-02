import { Router } from 'express';
const router = Router();
import { protectAdmin } from '../middleware/auth.js';
import { getOverview, getActivityChart, getTopArtisans, getTouristDemographics, getWorkshopPopularity } from '../controllers/analyticsController.js';

router.use(protectAdmin);

router.get('/overview', getOverview);
router.get('/activity', getActivityChart);
router.get('/top-artisans', getTopArtisans);
router.get('/tourist-demographics', getTouristDemographics);
router.get('/workshop-popularity', getWorkshopPopularity);

export default router;



import { Router } from 'express';
import { protectAdmin } from '../middleware/auth.js';
import * as artisanController from '../controllers/artisanController.js';
import * as workshopController from '../controllers/workshopController.js';
import * as touristController from '../controllers/touristController.js';

const router = Router();

// All admin routes are protected
router.use(protectAdmin);

// ── Artisans ──────────────────────────────────────────────────────────────────
router.get('/artisans', artisanController.getArtisans);
router.get('/artisans/:id', artisanController.getArtisan);
router.patch('/artisans/:id/status', artisanController.updateArtisanStatus);

// ── Tourists ──────────────────────────────────────────────────────────────────
router.get('/tourists', touristController.getTourists);
router.patch('/tourists/:id/status', touristController.toggleTouristStatus);

// ── Workshops ─────────────────────────────────────────────────────────────────
router.get('/workshops', workshopController.getWorkshops);
router.get('/workshops/:id', workshopController.getWorkshop);
router.patch('/workshops/:id/status', workshopController.updateWorkshopStatus);
router.get('/workshops/bookings', workshopController.getBookings);

export default router;



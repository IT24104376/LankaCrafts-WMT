import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getAdminReviews,
  getReviews,
  markHelpful,
  moderateReview,
  replyToReview,
  updateReview
} from '../controllers/reviewController.js';
import { protectUser, protectAdmin, optionalProtectUser } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalProtectUser, getReviews);
router.get('/admin', protectAdmin, getAdminReviews);
router.post('/', protectUser, createReview);
router.patch('/:id', protectUser, updateReview);
router.delete('/:id', protectUser, deleteReview);
router.post('/:id/reply', protectUser, replyToReview);
router.post('/:id/helpful', protectUser, markHelpful);
router.post('/:id/moderate', protectAdmin, moderateReview);

export default router;

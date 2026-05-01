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
import { verifyAnyFirebaseToken, protect, optionalVerifyAnyFirebaseToken } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalVerifyAnyFirebaseToken, getReviews);
router.get('/admin', protect, getAdminReviews);
router.post('/', verifyAnyFirebaseToken, createReview);
router.patch('/:id', verifyAnyFirebaseToken, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/reply', verifyAnyFirebaseToken, replyToReview);
router.post('/:id/helpful', verifyAnyFirebaseToken, markHelpful);
router.post('/:id/moderate', protect, moderateReview);

export default router;

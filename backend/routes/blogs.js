import express from 'express';
import multer from 'multer';
import { protectTourist } from '../middleware/auth.js';
import {
  listBlogs,
  listMyBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  getBlog,
} from '../services/blogService.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Multer Configuration
// ─────────────────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 40 * 1024 * 1024, // optional per-file safety (max 40MB each)
    files: 10, // max number of files
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/quicktime', 'video/webm',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type.'));
  },
});

// Accept up to 10 files under 'media'
const uploadMedia = upload.array('media', 10);

const TOTAL_LIMIT = 40 * 1024 * 1024; // 40MB

const checkTotalSize = (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  const totalSize = req.files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > TOTAL_LIMIT) {
    return res.status(400).json({
      message: 'Total upload size must not exceed 40MB.',
    });
  }

  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tourist/blogs
// Public — list all published blogs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const { page, limit, sort, tag } = req.query;
  const result = await listBlogs(page, limit, sort, tag);
  res.json(result);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tourist/blogs/me
// Private — user's blogs
// ─────────────────────────────────────────────────────────────────────────────
router.get('/me', protectTourist, async (req, res) => {
  const blogs = await listMyBlogs(req.tourist._id);
  res.json({ blogs });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tourist/blogs/:id
// Public — single blog
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const result = await getBlog(req.params.id);
  res.json(result);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tourist/blogs
// Create blog
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  protectTourist,
  uploadMedia,
  checkTotalSize,
  async (req, res) => {
    const blog = await createBlog(
      req.tourist._id,
      req.body,
      req.files ?? []
    );

    res.status(201).json({
      message: `Blog ${blog.status === 'draft' ? 'saved as draft' : 'published'} successfully.`,
      blog,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tourist/blogs/:id/like
// Toggle like
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/like', protectTourist, async (req, res) => {
  const result = await toggleLike(req.params.id, req.tourist._id);
  res.json(result);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/tourist/blogs/:id
// Update blog
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  '/:id',
  protectTourist,
  uploadMedia,
  checkTotalSize,
  async (req, res) => {
    const blog = await updateBlog(
      req.params.id,
      req.tourist._id,
      req.body,
      req.files ?? []
    );

    res.json({
      message: 'Blog updated successfully.',
      blog,
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tourist/blogs/:id
// Delete blog
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', protectTourist, async (req, res) => {
  await deleteBlog(req.params.id, req.tourist._id);
  res.json({ message: 'Blog deleted successfully.' });
});

export default router;


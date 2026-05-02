import { validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import { signToken } from '../utils/tokenHelper.js';

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    let admin = await Admin.findOne({ email }).select('+password');

    // Fallback to .env seed credentials if not in DB
    const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@lankacraft.lk';
    const seedPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@1234';

    if (!admin) {
      if (email === seedEmail && password === seedPassword) {
        // Return a mock admin object for the seed user
        const token = signToken('seed-admin-id', 'super_admin');
        return res.json({
          success: true,
          token,
          admin: { id: 'seed-admin-id', name: 'System Admin', email: seedEmail, role: 'super_admin' },
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(admin._id, admin.role);
    res.json({
      success: true,
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    if (req.admin.id === 'seed-admin-id') {
      const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@lankacraft.lk';
      return res.json({
        success: true,
        admin: { id: 'seed-admin-id', name: 'System Admin', email: seedEmail, role: 'super_admin' }
      });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found.' });
    res.json({ success: true, admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    next(err);
  }
}

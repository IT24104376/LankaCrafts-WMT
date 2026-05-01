import jwt from 'jsonwebtoken';
import Tourist from '../models/Tourist.js';
import Artist from '../models/Artist.js';

/**
 * Middleware: protectAdmin
 * Verifies custom JWT for Admin roles.
 */
export const protectAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Access denied.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Middleware: protectTourist
 * Verifies local JWT for Tourists and loads MongoDB profile.
 */
export const protectTourist = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization header must start with "Bearer ".'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed authorization header.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the tourist profile in MongoDB
    const tourist = await Tourist.findById(decoded.id);

    if (!tourist || tourist.status !== 'active') {
      return res.status(404).json({
        error: 'Tourist profile not found or deactivated.',
      });
    }

    // Attach data to request object
    req.tourist = tourist;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: protectArtist
 * Verifies local JWT for Artists and loads MongoDB profile.
 */
export const protectArtist = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization header must start with "Bearer ".'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed authorization header.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the artist profile in MongoDB
    const artist = await Artist.findById(decoded.id);

    if (!artist || (artist.status !== 'active' && artist.status !== 'pending')) {
      return res.status(404).json({
        error: 'Artist profile not found or deactivated.',
      });
    }

    // Attach data to request object
    req.artist = artist;
    req.uid = artist._id; // For compatibility with some routes
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Middleware: optionalProtectUser
 */
export const optionalProtectUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === 'tourist') {
      user = await Tourist.findById(decoded.id);
    } else if (decoded.role === 'artist') {
      user = await Artist.findById(decoded.id);
    }

    if (user && user.status === 'active') {
      req.user = { uid: user._id, role: decoded.role, email: user.email };
    }
    next();
  } catch (err) {
    next();
  }
};

/**
 * Middleware: protectUser
 * Verifies local JWT and loads either Tourist or Artist profile.
 */
export const protectUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization header must start with "Bearer ".'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Malformed authorization header.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (decoded.role === 'tourist') {
      user = await Tourist.findById(decoded.id);
    } else if (decoded.role === 'artist') {
      user = await Artist.findById(decoded.id);
    }

    if (!user || user.status !== 'active') {
      return res.status(404).json({
        error: 'User profile not found or deactivated.',
      });
    }

    req.user = { uid: user._id, role: decoded.role, email: user.email };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
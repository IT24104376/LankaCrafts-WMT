import jwt from 'jsonwebtoken';
import admin from '../config/firebase.js';
import Tourist from '../models/Tourist.js';
import Artist from '../models/Artist.js';

/**
 * Middleware: protect
 * Verifies custom JWT for Admin roles.
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No token provided. Access denied.'
    });
  }

  // Split by space and take the second element
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
 * Middleware: verifyFirebaseToken
 * Verifies Firebase ID token for Tourists and loads MongoDB profile.
 */
export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if header exists and format is correct (case-insensitive check)
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization header must start with "Bearer ".'
      });
    }

    // Safely extract the token by splitting at the space
    const idToken = authHeader.split(' ')[1];

    if (!idToken) {
      return res.status(401).json({ error: 'Malformed authorization header.' });
    }

    // Verify with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!decodedToken) {
      return res.status(401).json({ error: 'Failed to authenticate with Firebase.' });
    }

    const { uid, email } = decodedToken;

    // Find the tourist profile in MongoDB
    const tourist = await Tourist.findOne({ firebaseUid: uid, status: 'active' });

    if (!tourist) {
      return res.status(404).json({
        error: 'Tourist profile not found or deactivated.',
        uid,
      });
    }

    // Attach data to request object
    req.tourist = tourist;
    req.firebaseUid = uid;
    req.firebaseEmail = email;

    next();
  } catch (err) {
    // Handle specific Firebase Auth errors
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

/**
 * Middleware: optionalVerifyAnyFirebaseToken
 * Optionally verifies Firebase ID token. If no token or invalid token,
 * it just continues without setting req.user.
 */
export const optionalVerifyAnyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return next();
    }

    const idToken = authHeader.split(' ')[1];
    if (!idToken) return next();

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken) return next();

    const { uid, email } = decodedToken;

    let user = await Tourist.findOne({ firebaseUid: uid, status: 'active' });
    let role = 'tourist';

    if (!user) {
      user = await Artist.findOne({ firebaseUid: uid, status: 'active' });
      role = 'artist';
    }

    if (user) {
      req.user = { uid: user._id, role, firebaseUid: uid, email };
    }
    next();
  } catch (err) {
    // If verification fails, we just proceed as unauthenticated
    next();
  }
};

/**
 * Middleware: verifyAnyFirebaseToken
 * Verifies Firebase ID token and loads either Tourist or Artist profile.
 */
export const verifyAnyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({
        error: 'No token provided. Authorization header must start with "Bearer ".'
      });
    }

    const idToken = authHeader.split(' ')[1];
    if (!idToken) {
      return res.status(401).json({ error: 'Malformed authorization header.' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Failed to authenticate with Firebase.' });
    }

    const { uid, email } = decodedToken;

    let user = await Tourist.findOne({ firebaseUid: uid, status: 'active' });
    let role = 'tourist';

    if (!user) {
      user = await Artist.findOne({ firebaseUid: uid, status: 'active' });
      role = 'artist';
    }

    if (!user) {
      return res.status(404).json({
        error: 'User profile not found or deactivated.',
        uid,
      });
    }

    req.user = { uid: user._id, role, firebaseUid: uid, email };
    next();
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    if (err.code === 'auth/argument-error' || err.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    console.error('Auth middleware error:', err.message);
    return res.status(500).json({ error: 'Authentication error.' });
  }
};

/**
 * Middleware: protectUserOrAdmin
 * Allows authenticated app users (tourist/artist) OR admins.
 */
export const protectUserOrAdmin = async (req, res, next) => {
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

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  if (decoded.role === 'admin' || decoded.role === 'super_admin') {
    req.admin = decoded;
    return next();
  }

  try {
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
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
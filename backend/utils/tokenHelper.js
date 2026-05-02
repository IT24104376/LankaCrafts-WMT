import jwt from 'jsonwebtoken';

/**
 * Sign a JWT for a user.
 * @param {string} id - User ID
 * @param {string} role - User role (e.g. 'tourist', 'artist', 'admin')
 * @returns {string} - Signed JWT
 */
export const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

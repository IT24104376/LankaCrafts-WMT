import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const testUser = {
  id: '662688998877665544332211',
  role: 'tourist'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

console.log('Generated Token:', token);

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Decoded Payload:', decoded);
  if (decoded.id === testUser.id && decoded.role === testUser.role) {
    console.log('Verification Success: Payload matches.');
  } else {
    console.log('Verification Failure: Payload mismatch.');
  }
} catch (err) {
  console.error('Verification Failure:', err.message);
}

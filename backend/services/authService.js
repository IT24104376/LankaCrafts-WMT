import Tourist from '../models/Tourist.js';
import Artist from '../models/Artist.js';

/**
 * Register a new tourist profile manually.
 */
export async function registerTourist(body) {
  const {
    fullName,
    callingName,
    email,
    password,
    country,
    preferredLanguages,
    idNumber,
    dateOfBirth,
    address,
    interests,
    preferredRegions,
  } = body;

  const existing = await Tourist.findOne({ email });
  if (existing) {
    const e = new Error('A tourist with this email already exists.');
    e.status = 409;
    throw e;
  }

  if (idNumber) {
    const existingId = await Tourist.findOne({ idNumber });
    if (existingId) {
      const e = new Error('This Identity Number (NIC or Passport) is already registered.');
      e.status = 409;
      throw e;
    }
  }

  if (!fullName || !country || !email || !password) {
    const e = new Error('fullName, country, email, and password are required.');
    e.status = 400;
    throw e;
  }

  const tourist = await Tourist.create({
    fullName,
    callingName,
    email,
    password,
    country,
    preferredLanguages: preferredLanguages || [],
    idNumber: idNumber || '',
    dateOfBirth: dateOfBirth || undefined,
    address: address || {},
    interests: interests || [],
    preferredRegions: preferredRegions || [],
    profilePicUrl: '',
  });

  return tourist;
}

/**
 * Login a tourist manually.
 */
export async function loginTourist(email, password) {
  const tourist = await Tourist.findOne({ email, status: 'active' }).select('+password');
  if (!tourist) {
    const e = new Error('Invalid email or password.');
    e.status = 401;
    throw e;
  }

  const isMatch = await tourist.comparePassword(password);
  if (!isMatch) {
    const e = new Error('Invalid email or password.');
    e.status = 401;
    throw e;
  }

  return tourist;
}

/**
 * Register a new artist profile manually.
 */
export async function registerArtist(body) {
  const {
    fullName,
    callingName,
    email,
    password,
    phone,
    craftType,
    bio,
    profilePicUrl,
    address, 
    availability,
  } = body;

  const existing = await Artist.findOne({ email });
  if (existing){
    const e = new Error("An artist with this email already exists.");
    e.status = 409;
    throw e;
  }

  if (!fullName || !craftType || !address || !email || !password) {
    const e = new Error('fullName, craftType, email, password, and address are required.');
    e.status = 400;
    throw e;
  }

  const artist = await Artist.create({
    fullName,
    callingName: callingName || fullName.split(' ')[0],
    email,
    password,
    phone: phone || '',
    craftType,
    bio: bio || '',
    profilePicUrl: profilePicUrl || '',
    address,
    availability: availability || {},
    status: 'active',
  });

  return artist;
} 

/**
 * Login an artist manually.
 */
export async function loginArtist(email, password) {
  const artist = await Artist.findOne({ email, status: 'active' }).select('+password');
  if (!artist) {
    const e = new Error('Invalid email or password.');
    e.status = 401;
    throw e;
  }

  const isMatch = await artist.comparePassword(password);
  if (!isMatch) {
    const e = new Error('Invalid email or password.');
    e.status = 401;
    throw e;
  }

  return artist;
}

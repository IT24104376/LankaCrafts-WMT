import Artist from '../models/Artist.js';
import { uploadBufferToCloudinary, deleteByUrl } from '../utils/cloudinaryHelper.js';

export async function uploadProfilePicture(artist, fileBuffer) {
  // Delete old image from Cloudinary if present
  if (artist.profilePicUrl) {
    try {
      await deleteByUrl(artist.profilePicUrl);
    } catch (delErr) {
      console.error('Failed to delete old image from Cloudinary:', delErr);
    }
  }

  const result = await uploadBufferToCloudinary(fileBuffer, 'lankacrafts/artists', 'image');

  const updated = await Artist.findByIdAndUpdate(
    artist._id,
    { $set: { profilePicUrl: result.secure_url } },
    { new: true }
  );

  return { profilePicUrl: result.secure_url, artist: updated };
}

export async function registerArtist(body) {
  const {
    fullName,
    callingName,
    email,
    password,
    phone,
    craftType,
    bio,
    address,
    location,
    specialties,
    availability,
  } = body;

  const existing = await Artist.findOne({ email });
  if (existing) {
    const e = new Error('An artist with this email already exists.');
    e.status = 409;
    throw e;
  }

  if (!fullName || !craftType || !email || !password) {
    const e = new Error('fullName, craftType, email, and password are required.');
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
    address: address || {},
    location: location || { type: 'Point', coordinates: [0, 0], formattedAddress: '' },
    specialties: specialties || [],
    availability: availability || {},
    profilePicUrl: '',
    status: 'active',
  });

  return artist;
}

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

export async function getArtistProfile(id) {
  const artist = await Artist.findById(id);
  if (!artist) {
    const e = new Error('Artist profile not found.');
    e.status = 404;
    throw e;
  }
  return artist;
}

export async function updateArtistProfile(id, updates) {
  const allowedUpdates = [
    'fullName', 'callingName', 'phone', 'craftType', 'bio', 'profilePicUrl',
    'address', 'location', 'specialties', 'availability'
  ];

  const filteredUpdates = {};
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  const artist = await Artist.findByIdAndUpdate(
    id,
    filteredUpdates,
    { new: true, runValidators: true }
  );

  if (!artist) {
    const e = new Error('Artist profile not found.');
    e.status = 404;
    throw e;
  }

  return artist;
}

export async function deleteArtistProfile(id) {
  const artist = await Artist.findByIdAndDelete(id);
  if (!artist) {
    const e = new Error('Artist profile not found.');
    e.status = 404;
    throw e;
  }
  return artist;
}

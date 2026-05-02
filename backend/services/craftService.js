import Craft from '../models/Craft.js';

export async function createCraft(artistId, craftData) {
  const {
    name,
    description,
    price,
    currency,
    category,
    images,
    stock,
    dimensions,
    weight,
    materials,
    tags,
  } = craftData;

  if (!name || !price || !category) {
    const e = new Error('name, price, and category are required.');
    e.status = 400;
    throw e;
  }

  const craft = await Craft.create({
    artistId,
    name,
    description: description || '',
    price,
    currency: currency || 'LKR',
    category,
    images: images || [],
    stock: stock ?? 1,
    dimensions: dimensions || {},
    weight: weight || {},
    materials: materials || [],
    tags: tags || [],
    isAvailable: true,
  });

  return craft;
}

export async function getCraftsByArtist(artistId) {
  return await Craft.find({ artistId }).sort({ createdAt: -1 });
}

export async function getCraftById(craftId) {
  const craft = await Craft.findById(craftId);
  if (!craft) {
    const e = new Error('Craft not found.');
    e.status = 404;
    throw e;
  }
  return craft;
}

export async function updateCraft(craftId, artistId, updates) {
  const craft = await Craft.findOne({ _id: craftId, artistId });
  if (!craft) {
    const e = new Error('Craft not found or unauthorized.');
    e.status = 404;
    throw e;
  }

  const allowedUpdates = [
    'name', 'description', 'price', 'currency', 'category',
    'images', 'stock', 'isAvailable', 'dimensions', 'weight',
    'materials', 'tags'
  ];

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      craft[key] = updates[key];
    }
  }

  await craft.save();
  return craft;
}

export async function deleteCraft(craftId, artistId) {
  const craft = await Craft.findOneAndDelete({ _id: craftId, artistId });
  if (!craft) {
    const e = new Error('Craft not found or unauthorized.');
    e.status = 404;
    throw e;
  }
  return craft;
}

export async function getAllCrafts(filters = {}, sort = { createdAt: -1 }, page = 1, limit = 20) {
  const query = { isAvailable: true, ...filters };

  const skip = (page - 1) * limit;

  const [crafts, total] = await Promise.all([
    Craft.find(query)
      .populate('artistId', 'fullName craftType location profilePicUrl')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Craft.countDocuments(query)
  ]);

  return {
    crafts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

export async function getCraftsByCategory(category, page = 1, limit = 20) {
  return await getAllCrafts({ category }, { createdAt: -1 }, page, limit);
}

export async function searchCrafts(query, page = 1, limit = 20) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ],
    isAvailable: true
  };

  return await getAllCrafts(searchQuery, { createdAt: -1 }, page, limit);
}

export async function incrementCraftViews(craftId) {
  return await Craft.findByIdAndUpdate(craftId, { $inc: { views: 1 } });
}

export async function incrementCraftSales(craftId) {
  return await Craft.findByIdAndUpdate(craftId, { $inc: { salesCount: 1 } });
}

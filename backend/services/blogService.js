import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import Blog from '../models/Blog.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Upload a raw buffer to Cloudinary and return the result.
 */
function uploadToCloudinary(buffer, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// NEW (minimal helper for cleanup)
async function deleteFromCloudinary(publicIds = []) {
  for (const id of publicIds) {
    try {
      await cloudinary.uploader.destroy(id);
    } catch (err) {
      console.error('Cloudinary delete failed:', id);
    }
  }
}

const MAX_MEDIA_COUNT = 10;

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Return a paginated, sorted list of published blogs.
 * sort: 'recent' | 'liked' | 'workshop'
 */
export async function listBlogs(page, limit, sort, tag) {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(50, parseInt(limit) || 12);

  let sortObj = { createdAt: -1 };
  if (sort === 'liked') sortObj = { likeCount: -1, createdAt: -1 };
  if (sort === 'workshop') sortObj = { workshopTag: 1, createdAt: -1 };

  // Base match: always published, optionally filtered by hashtag
  const baseMatch = { status: 'published' };
  if (sort === 'hashtag' && tag) {
    baseMatch.hashtags = tag; // MongoDB: "hashtag value is in the array"
  }

  let blogs, total;

  if (sort === 'liked') {
    const pipeline = [
      { $match: baseMatch },
      { $addFields: { likeCount: { $size: '$likes' } } },
      { $sort: { likeCount: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'tourists',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData',
        },
      },
      {
        $addFields: {
          author: {
            _id: { $arrayElemAt: ['$authorData._id', 0] },
            fullName: { $arrayElemAt: ['$authorData.fullName', 0] },
            country: { $arrayElemAt: ['$authorData.country', 0] },
            initials: { $arrayElemAt: ['$authorData.initials', 0] },
            profilePicUrl: { $arrayElemAt: ['$authorData.profilePicUrl', 0] },
          },
        },
      },
      { $project: { authorData: 0 } },
    ];
    blogs = await Blog.aggregate(pipeline);
    total = await Blog.countDocuments(baseMatch);
  } else {
    total = await Blog.countDocuments(baseMatch);
    blogs = await Blog.find(baseMatch)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'fullName country initials profilePicUrl');
  }

  return {
    blogs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Return the published blog belonging to a specific id.
 */
export async function getBlog(blogId) {
  return Blog.findOne({ _id: blogId, status: 'published' })
    .populate('author', 'fullName country initials profilePicUrl');
}

/**
 * Return all published + draft blogs belonging to a specific tourist.
 */
export async function listMyBlogs(touristId) {
  return Blog.find({
    author: touristId,
    status: { $in: ['published', 'draft'] },
  }).sort({ createdAt: -1 });
}

/**
 * Create a new blog, optionally uploading multiple media files to Cloudinary.
 * Accepts an array of files from multer (.array('media', 10)).
 */
export async function createBlog(touristId, body, files) {
  const { title, content, workshopTag, status } = body;

  let extractedHashtags = [];
  if (body.hashtags) {
    try {
      extractedHashtags = JSON.parse(body.hashtags);
    } catch (e) {
      extractedHashtags = Array.isArray(body.hashtags) ? body.hashtags : [body.hashtags];
    }
  }

  if (!title || !content) {
    const e = new Error('title and content are required.');
    e.status = 400;
    throw e;
  }

  // VALIDATE COUNT BEFORE UPLOAD
  if (files && files.length > MAX_MEDIA_COUNT) {
    const e = new Error(`Maximum ${MAX_MEDIA_COUNT} media files allowed.`);
    e.status = 400;
    throw e;
  }

  const mediaItems = [];
  const uploadedPublicIds = [];

  try {
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.mimetype.startsWith('video/');
        const result = await uploadToCloudinary(
          file.buffer,
          'lankacrafts/blogs',
          isVideo ? 'video' : 'image'
        );

        uploadedPublicIds.push(result.public_id);

        mediaItems.push({
          url: result.secure_url,
          publicId: result.public_id,
          mediaType: isVideo ? 'video' : 'image',
          order: i,
        });
      }
    }

    const blog = await Blog.create({
      title,
      content,
      workshopTag: workshopTag || '',
      media: mediaItems,
      hashtags: extractedHashtags,
      author: touristId,
      status: status === 'draft' ? 'draft' : 'published',
    });

    const populated = await blog.populate('author', 'fullName country initials profilePicUrl');
    return populated;

  } catch (err) {
    // rollback uploaded files if something fails
    await deleteFromCloudinary(uploadedPublicIds);
    throw err;
  }
}

/**
 * Update an existing blog owned by the tourist.
 * Throws 404 if not found, 403 if not the owner.
 *
 * New files are APPENDED to media[].
 * Pass a comma-separated list of Cloudinary publicIds in body.removeMediaIds
 * to remove specific existing media items.
 */
export async function updateBlog(blogId, touristId, body, files) {
  const blog = await Blog.findById(blogId);
  if (!blog) {
    const e = new Error('Blog not found.');
    e.status = 404;
    throw e;
  }
  if (!blog.author.equals(touristId)) {
    const e = new Error('You can only edit your own blogs.');
    e.status = 403;
    throw e;
  }

  const { title, content, workshopTag, status, removeMediaIds } = body;

  let extractedHashtags;
  if (body.hashtags !== undefined) {
    try {
      extractedHashtags = JSON.parse(body.hashtags);
    } catch (e) {
      extractedHashtags = Array.isArray(body.hashtags) ? body.hashtags : [body.hashtags];
    }
  }

  // — Remove requested media items —
  let removedIds = [];
  if (removeMediaIds) {
    const idsToRemove = removeMediaIds.split(',').map((s) => s.trim()).filter(Boolean);

    removedIds = blog.media
      .filter((m) => idsToRemove.includes(m.publicId))
      .map((m) => m.publicId);

    blog.media = blog.media.filter((m) => !idsToRemove.includes(m.publicId));
  }

  // VALIDATE COUNT BEFORE UPLOAD
  const existingCount = blog.media.length;
  const newCount = files?.length || 0;

  if (existingCount + newCount > MAX_MEDIA_COUNT) {
    const e = new Error(`Maximum ${MAX_MEDIA_COUNT} media files allowed per blog.`);
    e.status = 400;
    throw e;
  }

  const uploadedPublicIds = [];

  try {
    // — Upload and append new files —
    if (files && files.length > 0) {
      const startOrder = blog.media.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.mimetype.startsWith('video/');
        const result = await uploadToCloudinary(
          file.buffer,
          'lankacrafts/blogs',
          isVideo ? 'video' : 'image'
        );

        uploadedPublicIds.push(result.public_id);

        blog.media.push({
          url: result.secure_url,
          publicId: result.public_id,
          mediaType: isVideo ? 'video' : 'image',
          order: startOrder + i,
        });
      }
    }

    if (title) blog.title = title;
    if (content) blog.content = content;
    if (extractedHashtags !== undefined) blog.hashtags = extractedHashtags;
    if (workshopTag !== undefined) blog.workshopTag = workshopTag;
    if (status) blog.status = status;

    await blog.save();

    // delete removed media AFTER success
    if (removedIds.length > 0) {
      await deleteFromCloudinary(removedIds);
    }

    const populated = await blog.populate('author', 'fullName country initials profilePicUrl');
    return populated;

  } catch (err) {
    // rollback new uploads if error
    await deleteFromCloudinary(uploadedPublicIds);
    throw err;
  }
}

/**
 * Soft-delete a blog (sets status to 'deleted').
 * Throws 404 if not found, 403 if not the owner.
 */
export async function deleteBlog(blogId, touristId) {
  const blog = await Blog.findById(blogId);
  if (!blog) {
    const e = new Error('Blog not found.');
    e.status = 404;
    throw e;
  }
  if (!blog.author.equals(touristId)) {
    const e = new Error('You can only delete your own blogs.');
    e.status = 403;
    throw e;
  }

  blog.status = 'deleted';
  await blog.save();
}

/**
 * Toggle a like on a blog. Returns { liked, likeCount }.
 */
export async function toggleLike(blogId, touristId) {
  const blog = await Blog.findById(blogId);
  if (!blog) {
    const e = new Error('Blog not found.');
    e.status = 404;
    throw e;
  }

  const alreadyLiked = blog.likes.some((id) => id.equals(touristId));
  if (alreadyLiked) {
    blog.likes.pull(touristId);
  } else {
    blog.likes.push(touristId);
  }
  await blog.save();

  return { liked: !alreadyLiked, likeCount: blog.likes.length };
}

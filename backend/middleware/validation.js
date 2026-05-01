// Validation utilities for backend
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// ─────────────────────────────────────────────────────────
// Artist Validation Rules
// ─────────────────────────────────────────────────────────

export const artistRegisterValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  
  body('callingName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Calling name must be less than 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Invalid phone number format'),
  
  body('craftType')
    .trim()
    .notEmpty().withMessage('Craft type is required')
    .isLength({ min: 2, max: 100 }).withMessage('Craft type must be 2-100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Bio must be less than 2000 characters'),
  
  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required'),
  
  body('address.district')
    .trim()
    .notEmpty().withMessage('District is required'),
  
  body('address.province')
    .trim()
    .notEmpty().withMessage('Province is required'),
  
  body('specialties')
    .optional()
    .isArray().withMessage('Specialties must be an array'),
  
  body('availability')
    .optional()
    .isObject().withMessage('Availability must be an object'),
  
  validate
];

export const artistLoginValidation = [
  validate
];

// ─────────────────────────────────────────────────────────
// Craft Validation Rules
// ─────────────────────────────────────────────────────────

export const craftValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Craft name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Name must be 2-200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isLength({ min: 2, max: 100 }).withMessage('Category must be 2-100 characters'),
  
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of URLs'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('isAvailable')
    .optional()
    .isBoolean().withMessage('isAvailable must be a boolean'),
  
  body('dimensions')
    .optional()
    .isObject().withMessage('Dimensions must be an object'),
  
  body('weight')
    .optional()
    .isObject().withMessage('Weight must be an object'),
  
  validate
];

export const craftIdValidation = [
  param('id')
    .notEmpty().withMessage('Craft ID is required')
    .isMongoId().withMessage('Invalid craft ID format'),
  validate
];

// ─────────────────────────────────────────────────────────
// Payment Validation Rules
// ─────────────────────────────────────────────────────────

export const paymentValidation = [
  body('orderId')
    .trim()
    .notEmpty().withMessage('Order ID is required')
    .isLength({ max: 100 }).withMessage('Order ID must be less than 100 characters'),
  
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  
  body('currency')
    .optional()
    .isIn(['LKR', 'USD']).withMessage('Currency must be LKR or USD'),
  
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  
  body('phone')
    .optional()
    .trim(),
  
  body('items')
    .optional()
    .isString().withMessage('Items must be a string'),
  
  body('address')
    .optional()
    .trim(),
  
  body('city')
    .optional()
    .trim(),
  
  body('country')
    .optional()
    .trim(),
  
  validate
];

// ─────────────────────────────────────────────────────────
// Tourist Validation Rules
// ─────────────────────────────────────────────────────────

export const touristRegisterValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[0-9+\s-]{10,15}$/).withMessage('Invalid phone number format'),
  
  body('nationality')
    .optional()
    .trim(),
  
  body('preferredCraftTypes')
    .optional()
    .isArray().withMessage('Preferred craft types must be an array'),
  
  body('travelDates')
    .optional()
    .isObject().withMessage('Travel dates must be an object'),
  
  validate
];

// ─────────────────────────────────────────────────────────
// Blog Validation Rules
// ─────────────────────────────────────────────────────────

export const blogValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('coverImage')
    .optional()
    .trim(),
  
  validate
];

// ─────────────────────────────────────────────────────────
// Booking Validation Rules
// ─────────────────────────────────────────────────────────

export const bookingValidation = [
  body('workshopId')
    .notEmpty().withMessage('Workshop ID is required'),
  
  body('date')
    .notEmpty().withMessage('Booking date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('participants')
    .notEmpty().withMessage('Number of participants is required')
    .isInt({ min: 1, max: 50 }).withMessage('Participants must be between 1 and 50'),
  
  body('specialRequests')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Special requests must be less than 1000 characters'),
  
  validate
];

// ─────────────────────────────────────────────────────────
// Pagination & Query Validation
// ─────────────────────────────────────────────────────────

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['recent', 'oldest', 'popular', 'price-low', 'price-high'])
    .withMessage('Invalid sort option'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search query must be less than 100 characters'),
  
  validate
];
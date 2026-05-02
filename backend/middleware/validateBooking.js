export const validateBookingBody = (req, res, next) => {
  const { artisanId, craftId, phone, date, time, groupSize } = req.body;
  const isUpdate = req.method === 'PUT' || req.method === 'PATCH';

  // Required fields check (only on create)
  if (!isUpdate) {
    if (!artisanId || !craftId || !phone || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: artisanId, craftId, phone, date, and time.'
      });
    }
  }

  // Phone validation (at least 10 digits)
  if (phone) {
    const phoneRegex = /^\+?[0-9\s\-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format.'
      });
    }
  }

  // Group size validation
  if (groupSize !== undefined && (isNaN(groupSize) || groupSize < 1)) {
    return res.status(400).json({
      success: false,
      error: 'Group size must be at least 1.'
    });
  }

  next();
};
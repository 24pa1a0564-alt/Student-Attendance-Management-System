const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

/**
 * Protect routes: verify JWT from Bearer header or HTTP-only cookie
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Check Bearer token in authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Or check signed/secure cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    req.user = user;

    // Attach role-specific profile if student or faculty
    if (user.role === 'student') {
      const student = await Student.findOne({ userId: user._id });
      req.studentProfile = student;
    } else if (user.role === 'faculty') {
      const faculty = await Faculty.findOne({ userId: user._id });
      req.facultyProfile = faculty;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication session expired or token is invalid. Please log in again.',
    });
  }
};

/**
 * Authorize specific roles
 * @param  {...string} roles - e.g. 'admin', 'faculty'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};

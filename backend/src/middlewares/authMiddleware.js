// src/middlewares/authMiddleware.js

import ApiError from '../utils/ApiError.js';

export const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return next(new ApiError(401, 'Unauthorized. Please log in.'));
  }

  return next();
};

export const requireRole = (...roles) => {
  const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

  return (req, res, next) => {
    if (!req.session?.userId) {
      return next(new ApiError(401, 'Unauthorized. Please log in.'));
    }

    if (!allowedRoles.length) {
      return next(new ApiError(500, 'Role configuration is missing.'));
    }

    if (!allowedRoles.includes(req.session.role)) {
      return next(new ApiError(403, 'Forbidden. Insufficient permissions.'));
    }

    return next();
  };
};
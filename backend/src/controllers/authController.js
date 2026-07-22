// src/controllers/authController.js

import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ENV } from '../config/env.js';
import { ROLES } from '../constants/roles.js';

const SESSION_KEYS = ['userId', 'role', 'orgId'];

const sessionRegenerate = (req) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      return resolve();
    });
  });

const sessionSave = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) return reject(error);
      return resolve();
    });
  });

const sessionDestroy = (req) =>
  new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) return reject(error);
      return resolve();
    });
  });

const normalizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const normalizeName = (name) => {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
};

const isValidPassword = (password) => {
  return typeof password === 'string' && password.trim().length >= 8;
};

const sanitizeRole = (role) => {
  if (!role || typeof role !== 'string') return null;
  const cleanedRole = role.trim();

  if (Object.values(ROLES).includes(cleanedRole)) {
    return cleanedRole;
  }

  return null;
};

const buildUserResponse = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  orgId: user.orgId ? user.orgId.toString() : null,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createSessionForUser = async (req, user) => {
  await sessionRegenerate(req);

  req.session.userId = user._id.toString();
  req.session.role = user.role;
  req.session.orgId = user.orgId ? user.orgId.toString() : null;

  await sessionSave(req);
};

export const register = asyncHandler(async (req, res) => {
  const name = normalizeName(req.body.name);
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!name) {
    throw new ApiError(400, 'Name is required');
  }

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  if (!isValidPassword(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw new ApiError(409, 'Email already exists');
  }

  const requestedRole = sanitizeRole(req.body.role);
  const isElevatedCreator =
    req.session?.userId &&
    [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(req.session.role);

  const role = isElevatedCreator && requestedRole ? requestedRole : ROLES.EMPLOYEE;

  const user = await User.create({
    name,
    email,
    passwordHash: password,
    role,
    orgId: req.session?.orgId || null,
  });

  await createSessionForUser(req, user);

  return res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: buildUserResponse(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is disabled');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLoginAt = new Date();
  await user.save();

  await createSessionForUser(req, user);

  return res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    user: buildUserResponse(user),
  });
});

export const logout = asyncHandler(async (req, res) => {
  if (!req.session) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  await sessionDestroy(req);

  res.clearCookie(ENV.COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure: ENV.isProduction,
    sameSite: ENV.isProduction ? 'none' : 'lax',
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.session?.userId) {
    throw new ApiError(401, 'Not authenticated');
  }

  const user = await User.findById(req.session.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res.status(200).json({
    success: true,
    user: buildUserResponse(user),
  });
});
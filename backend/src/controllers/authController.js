// src/controllers/authController.js

import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { ENV } from '../config/env.js';
import { ROLES } from '../constants/roles.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendMagicLinkEmail } from '../services/emailService.js';

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

export const googleAuthInit = asyncHandler(async (req, res) => {
  const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
  res.redirect(url);
});

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw new ApiError(400, 'No code provided');

  const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/google/callback`;
  
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });
  
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new ApiError(401, 'Google OAuth failed');

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  
  const userData = await userRes.json();
  if (!userRes.ok) throw new ApiError(401, 'Google OAuth failed to get user info');

  let user = await User.findOne({ email: userData.email });
  if (!user) {
    user = await User.create({
      name: userData.name,
      email: userData.email,
      googleId: userData.id,
      role: 'SUPER_ADMIN',
      passwordHash: crypto.randomBytes(20).toString('hex')
    });
  } else if (!user.googleId) {
    user.googleId = userData.id;
    await user.save();
  }

  await createSessionForUser(req, user);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
});

export const githubAuthInit = asyncHandler(async (req, res) => {
  const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user:email`;
  res.redirect(url);
});

export const githubAuthCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) throw new ApiError(400, 'No code provided');

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });
  
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new ApiError(401, 'GitHub OAuth failed: ' + tokenData.error_description);

  // Get user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  
  const userData = await userRes.json();
  if (!userRes.ok) throw new ApiError(401, 'GitHub OAuth failed to get user info');

  // Get user email (GitHub sometimes doesn't return email in the main profile if it's private)
  let email = userData.email;
  if (!email) {
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const emails = await emailRes.json();
    const primaryEmail = emails.find(e => e.primary) || emails[0];
    if (primaryEmail) email = primaryEmail.email;
  }

  if (!email) throw new ApiError(400, 'GitHub account must have an email address');

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: userData.name || userData.login,
      email,
      githubId: userData.id.toString(),
      role: 'SUPER_ADMIN',
      passwordHash: crypto.randomBytes(20).toString('hex')
    });
  } else if (!user.githubId) {
    user.githubId = userData.id.toString();
    await user.save();
  }

  await createSessionForUser(req, user);
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) throw new ApiError(400, 'Email is required');

  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ success: true, message: 'If email exists, reset link sent' });

  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendPasswordResetEmail(user.email, resetToken);
  res.status(200).json({ success: true, message: 'If email exists, reset link sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, 'Token and password required');
  if (!isValidPassword(password)) throw new ApiError(400, 'Password must be at least 8 characters');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  }).select('+passwordHash');

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.passwordHash = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Password reset successfully' });
});

export const requestMagicLink = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  if (!email) throw new ApiError(400, 'Email is required');

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: email.split('@')[0],
      email,
      role: 'SUPER_ADMIN',
      passwordHash: crypto.randomBytes(20).toString('hex')
    });
  }

  const magicToken = crypto.randomBytes(20).toString('hex');
  user.magicLinkToken = crypto.createHash('sha256').update(magicToken).digest('hex');
  user.magicLinkExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  await sendMagicLinkEmail(user.email, magicToken);
  res.status(200).json({ success: true, message: 'Magic link sent' });
});

export const verifyMagicLink = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'Token required');

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    magicLinkToken: hashedToken,
    magicLinkExpire: { $gt: Date.now() }
  });

  if (!user) throw new ApiError(400, 'Invalid or expired magic link');

  user.magicLinkToken = undefined;
  user.magicLinkExpire = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  await createSessionForUser(req, user);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    user: buildUserResponse(user),
  });
});
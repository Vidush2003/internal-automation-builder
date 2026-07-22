// src/config/env.js
import 'dotenv/config';
const required = (key) => {
  const value = process.env[key];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value.trim();
};

const parseOrigins = (value) => {
  if (!value || !String(value).trim()) {
    return ['http://localhost:5173'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const ENV = Object.freeze({
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  PORT: Number(process.env.PORT || 5000),

  MONGO_URI: required('MONGO_URI'),
  REDIS_URL: required('REDIS_URL'),
  SESSION_SECRET: required('SESSION_SECRET'),

  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_URL),

  COOKIE_NAME: process.env.COOKIE_NAME?.trim() || 'automation.sid',
  COOKIE_MAX_AGE_MS: Number(process.env.COOKIE_MAX_AGE_MS || 1000 * 60 * 60 * 24),

  get isProduction() {
    return this.NODE_ENV === 'production';
  },
});
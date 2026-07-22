// src/middlewares/errorHandler.js

import ApiError from '../utils/ApiError.js';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    let details = error.details || null;

    if (error instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = 'Validation failed';
        details = Object.values(error.errors).map((item) => item.message);
    }

    if (error instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${error.path}: ${error.value}`;
    }

    if (error?.code === 11000) {
        statusCode = 409;
        const duplicateKey = Object.keys(error.keyValue || {})[0];
        message = duplicateKey
            ? `${duplicateKey} already exists`
            : 'Duplicate key error';
    }

    if (ENV.isProduction && statusCode === 500) {
        message = 'Internal Server Error';
        details = null;
    }

    return res.status(statusCode).json({
        success: false,
        message,
        ...(details ? { details } : {}),
    });
};
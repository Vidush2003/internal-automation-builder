// src/config/redis.js

import { createClient } from 'redis';
import { ENV } from './env.js';

export const redisClient = createClient({
    url: ENV.REDIS_URL,
});

redisClient.on('error', (error) => {
    console.error('[redis] client error:', error);
});

redisClient.on('connect', () => {
    console.log('[redis] connecting...');
});

redisClient.on('ready', () => {
    console.log('[redis] ready');
});

export const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
    return redisClient;
};

export const disconnectRedis = async () => {
    if (redisClient.isOpen) {
        await redisClient.quit();
    }
};
import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        error: 'Too many requests'
    },
    standardHeaders: true,
    legacyHeaders: false
})
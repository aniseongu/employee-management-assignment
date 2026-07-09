import { ApiError } from '../utils/ApiError.js';
import { logger } from '../lib/logger.js';

export function notFoundHandler(req, res) {
    res.status(404).json({ success: false, data: null, message: '요청한 리소스를 찾을 수 없습니다.' });
}

export function errorHandler(err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, data: null, message: err.message, errors: err.details });
    }
    logger.error(`[UNHANDLED] ${err.stack || err.message}`);
    return res.status(500).json({ success: false, data: null, message: '서버 오류가 발생했습니다.' });
}

import * as positionService from '../services/positionService.js';

export async function list(req, res, next) {
    try {
        const positions = await positionService.listPositions();
        res.json({ success: true, data: positions, message: null });
    } catch (err) {
        next(err);
    }
}

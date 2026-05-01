import ActivityLog from '../models/ActivityLog.js';

export async function getActivityFeed(req, res, next) {
    try {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
}

export async function getRecentActivity(req, res, next) {
    try {
        const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(6);
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
}

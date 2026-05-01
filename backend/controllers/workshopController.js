import Artist from '../models/Artist.js';
import Booking from '../models/workshopBooking.js';
import ActivityLog from '../models/ActivityLog.js';

export async function getWorkshops(req, res, next) {
    try {
        const { status, search } = req.query;
        const filter = {};
        if (status && status !== 'all') {
            if (status === 'approved') filter.status = 'active';
            else if (status === 'rejected') filter.status = 'deactivated';
            else filter.status = status;
        }
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { callingName: { $regex: search, $options: 'i' } },
                { craftType: { $regex: search, $options: 'i' } },
            ];
        }
        const workshops = await Artist.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: workshops, count: workshops.length });
    } catch (err) {
        next(err);
    }
}

export async function getWorkshop(req, res, next) {
    try {
        const workshop = await Artist.findById(req.params.id);
        if (!workshop) return res.status(404).json({ success: false, message: 'Artist/Workshop not found.' });
        res.json({ success: true, data: workshop });
    } catch (err) {
        next(err);
    }
}

export async function updateWorkshopStatus(req, res, next) {
    try {
        let { status } = req.body;
        
        let mappedStatus = status;
        if (status === 'approved') mappedStatus = 'active';
        if (status === 'rejected') mappedStatus = 'deactivated';

        if (!['active', 'deactivated', 'pending'].includes(mappedStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }
        const workshop = await Artist.findByIdAndUpdate(
            req.params.id,
            { status: mappedStatus },
            { new: true, runValidators: true }
        );
        if (!workshop) return res.status(404).json({ success: false, message: 'Artist/Workshop not found.' });

        await ActivityLog.create({
            type: status === 'approved' ? 'verify' : 'reject',
            user: workshop.fullName || 'Unknown',
            description: `Workshop/Artist ${mappedStatus}: ${workshop.fullName}`,
            page: '/admin/workshop-verification',
        });

        res.json({ success: true, data: workshop });
    } catch (err) {
        next(err);
    }
}

export async function getBookings(req, res, next) {
    try {
        const { craft, search } = req.query;
        const filter = {};
        if (craft && craft !== 'all') filter.craftName = craft;
        if (search) {
            filter.$or = [
                { customerName: { $regex: search, $options: 'i' } },
                { craftName: { $regex: search, $options: 'i' } },
                { artisanName: { $regex: search, $options: 'i' } },
            ];
        }
        const bookings = await Booking.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, data: bookings, count: bookings.length });
    } catch (err) {
        next(err);
    }
}

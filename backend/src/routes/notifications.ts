import { Router, Request, Response } from 'express';
import NotificationModel from '../models/Notification';

const router = Router();

// GET /api/notifications — Get all notifications (newest first)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const notifications = await NotificationModel.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/notifications/:id/read — Mark notification as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const notification = await NotificationModel.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/notifications/read-all — Mark all notifications as read
router.patch('/read-all', async (_req: Request, res: Response) => {
  try {
    await NotificationModel.updateMany({ read: false }, { read: true });
    res.json({ success: true, data: null, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/notifications/unread-count — Get unread count
router.get('/unread-count', async (_req: Request, res: Response) => {
  try {
    const count = await NotificationModel.countDocuments({ read: false });
    res.json({ success: true, data: { count } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

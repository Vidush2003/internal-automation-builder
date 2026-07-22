import SystemLog from '../models/SystemLog.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const getLogs = asyncHandler(async (req, res) => {
  const query = req.session.orgId 
    ? { orgId: req.session.orgId } 
    : { triggeredBy: req.session.userId };
    
  // If we want system-wide logs to be visible (e.g. for super admins), we can expand this.
  // For now, let's fetch all logs for the current user/org, plus any global system logs without orgId if they are an admin.
  // We'll just fetch all for now and limit to 50 for simplicity.
  const logs = await SystemLog.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('triggeredBy', 'name email');

  res.status(200).json({ success: true, logs });
});

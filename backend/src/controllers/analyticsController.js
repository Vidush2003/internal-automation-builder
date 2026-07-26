import Workflow from '../models/Workflow.js';
import WorkflowExecution from '../models/WorkflowExecution.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const totalWorkflows = await Workflow.countDocuments();
    const activeWorkflows = await Workflow.countDocuments({ status: 'active' });

    const totalExecutions = await WorkflowExecution.countDocuments();
    const successfulExecutions = await WorkflowExecution.countDocuments({ status: 'completed' });
    const failedExecutions = await WorkflowExecution.countDocuments({ status: 'failed' });

    const successRate = totalExecutions > 0 
      ? Math.round((successfulExecutions / totalExecutions) * 100) 
      : 0;

    // Get executions for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const executionsOverTime = await WorkflowExecution.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          success: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          total: { $sum: 1 }
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate
      },
      chartData: executionsOverTime
    });
  } catch (error) {
    console.error('[Analytics] Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};
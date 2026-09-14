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

    const { range = '7D' } = req.query;
    const days = parseInt(range.replace('D', ''), 10) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const executionsByDate = await WorkflowExecution.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          success: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    const dataMap = {};
    executionsByDate.forEach(item => { dataMap[item._id] = item; });

    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      chartData.push(dataMap[dateString] || { _id: dateString, success: 0, failed: 0, total: 0 });
    }

    res.json({
      metrics: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate
      },
      chartData
    });
  } catch (error) {
    console.error('[Analytics] Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    const totalWorkflows = await Workflow.countDocuments();
    const totalExecutions = await WorkflowExecution.countDocuments();

    // Compute avg execution time from durationMs
    const avgDurationResult = await WorkflowExecution.aggregate([
      { $match: { durationMs: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$durationMs" } } }
    ]);

    const realAvgMs = avgDurationResult.length > 0 ? avgDurationResult[0].avg : 0;
    const avgExecutionSeconds = (realAvgMs / 1000).toFixed(2);

    const successfulExecutions = await WorkflowExecution.countDocuments({ status: 'completed' });

    const successRate = totalExecutions > 0
      ? ((successfulExecutions / totalExecutions) * 100).toFixed(2)
      : "100.00";

    res.json({
      totalWorkflows,
      totalExecutions,
      avgExecutionSeconds,
      successRate
    });
  } catch (error) {
    console.error('[Analytics] Error fetching public stats:', error);
    res.status(500).json({ error: 'Failed to fetch public stats' });
  }
};
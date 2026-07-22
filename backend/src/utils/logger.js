import SystemLog from '../models/SystemLog.js';

/**
 * Logs a system action to the database.
 * @param {Object} params
 * @param {string} params.action - e.g. 'SEND_EMAIL', 'USER_LOGIN'
 * @param {string} params.status - 'success', 'error', 'info', 'warning'
 * @param {string} params.message - Human readable description
 * @param {Object} [params.metadata] - Optional JSON metadata (e.g. preview URL, node ID)
 * @param {string} [params.triggeredBy] - User ID who triggered the action
 * @param {string} [params.orgId] - Organization ID
 */
export const logSystemAction = async ({ action, status = 'info', message, metadata = {}, triggeredBy = null, orgId = null }) => {
  try {
    await SystemLog.create({
      action,
      status,
      message,
      metadata,
      triggeredBy,
      orgId
    });
  } catch (error) {
    console.error('[Logger] Failed to save system log:', error);
  }
};

const db = require('../config/database');
const { encrypt, decrypt } = require('./encryption');

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {string} params.userId - User performing the action
 * @param {string} params.action - Action performed (e.g., 'create', 'update', 'delete')
 * @param {string} params.resource - Resource type (e.g., 'booking', 'user')
 * @param {string} params.resourceId - ID of affected resource
 * @param {Object} params.oldValues - Previous values (for updates)
 * @param {Object} params.newValues - New values
 * @param {Object} params.req - Express request object for IP/user agent
 */
const logAudit = async ({
  userId,
  action,
  resource,
  resourceId,
  oldValues = null,
  newValues = null,
  req = null
}) => {
  try {
    const auditData = {
      user_id: userId,
      action,
      resource,
      resource_id: resourceId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: req?.ip || req?.headers['x-forwarded-for'] || null,
      user_agent: req?.headers['user-agent'] || null
    };

    await db('audit_logs').insert(auditData);
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

/**
 * Get audit logs with filtering
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination options
 */
const getAuditLogs = async (filters = {}, pagination = { page: 1, limit: 50 }) => {
  const query = db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.*',
      db.raw("COALESCE(users.first_name || ' ' || users.last_name, 'System') as user_name")
    )
    .orderBy('audit_logs.created_at', 'desc');

  if (filters.userId) {
    query.where('audit_logs.user_id', filters.userId);
  }

  if (filters.action) {
    query.where('audit_logs.action', filters.action);
  }

  if (filters.resource) {
    query.where('audit_logs.resource', filters.resource);
  }

  if (filters.resourceId) {
    query.where('audit_logs.resource_id', filters.resourceId);
  }

  if (filters.startDate) {
    query.where('audit_logs.created_at', '>=', filters.startDate);
  }

  if (filters.endDate) {
    query.where('audit_logs.created_at', '<=', filters.endDate);
  }

  const offset = (pagination.page - 1) * pagination.limit;
  
  const [countResult, rows] = await Promise.all([
    query.clone().count('* as count').first(),
    query.limit(pagination.limit).offset(offset)
  ]);

  return {
    data: rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: parseInt(countResult.count, 10),
      totalPages: Math.ceil(parseInt(countResult.count, 10) / pagination.limit)
    }
  };
};

module.exports = {
  logAudit,
  getAuditLogs
};

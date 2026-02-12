const winston = require('winston');
const path = require('path');

/**
 * Security Audit Logger
 * Logs security-related events for compliance and monitoring
 */
const securityAuditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(process.cwd(), 'logs', 'security-audit.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
  securityAuditLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Security event types
 */
const SecurityEventTypes = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  AUTH_LOCKOUT: 'AUTH_LOCKOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
  DATA_EXPORT: 'DATA_EXPORT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  API_KEY_GENERATED: 'API_KEY_GENERATED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
  SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT: 'XSS_ATTEMPT'
};

/**
 * Log security event
 */
const logSecurityEvent = (eventType, details) => {
  securityAuditLogger.info({
    eventType,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Security audit middleware
 * Logs all requests for security auditing
 */
const securityAuditMiddleware = (req, res, next) => {
  const logData = {
    requestId: req.requestId,
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  // Log sensitive endpoint access
  const sensitiveEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/password',
    '/api/users',
    '/api/exports',
    '/api/admin'
  ];

  if (sensitiveEndpoints.some(endpoint => req.path.includes(endpoint))) {
    logSecurityEvent(SecurityEventTypes.SENSITIVE_DATA_ACCESS, {
      ...logData,
      body: req.method !== 'GET' ? Object.keys(req.body) : undefined
    });
  }

  // Monitor for suspicious patterns
  const suspiciousPatterns = [
    /SELECT\s+.*\s+FROM/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];

  const requestData = JSON.stringify({ ...req.body, ...req.query });
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      logSecurityEvent(SecurityEventTypes.SUSPICIOUS_ACTIVITY, {
        ...logData,
        pattern: pattern.toString(),
        matchedData: requestData.substring(0, 200)
      });
      break;
    }
  }

  next();
};

/**
 * Authentication audit middleware
 */
const authAuditMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = function(data) {
    const isAuthEndpoint = req.path.includes('/auth/');
    
    if (isAuthEndpoint) {
      const logData = {
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.path,
        email: req.body?.email,
        success: data.success,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString()
      };

      if (req.path.includes('/login')) {
        if (res.statusCode === 200) {
          logSecurityEvent(SecurityEventTypes.AUTH_SUCCESS, logData);
        } else {
          logSecurityEvent(SecurityEventTypes.AUTH_FAILURE, logData);
        }
      }
    }

    return originalJson(data);
  };

  next();
};

/**
 * Generate security audit report
 */
const generateSecurityReport = async (startDate, endDate) => {
  // This would typically query the audit log database
  // For now, return a placeholder structure
  return {
    period: { startDate, endDate },
    summary: {
      totalEvents: 0,
      authAttempts: { success: 0, failure: 0 },
      suspiciousActivities: 0,
      rateLimitHits: 0
    },
    recommendations: []
  };
};

module.exports = {
  securityAuditMiddleware,
  authAuditMiddleware,
  logSecurityEvent,
  generateSecurityReport,
  SecurityEventTypes
};

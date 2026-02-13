require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'base_super_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    pool: {
      min: 2,
      max: 10
    }
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRE || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key!!'
  },

  quickbooks: {
    clientId: process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    redirectUri: process.env.QB_REDIRECT_URI || 'http://localhost:5000/api/quickbooks/callback',
    environment: process.env.QB_ENVIRONMENT || 'sandbox'
  },

  email: {
    from: process.env.EMAIL_FROM || 'noreply@basecreative.com',
    fromName: process.env.EMAIL_FROM_NAME || 'Base Creative',
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    }
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },

  mailchimp: {
    apiKey: process.env.MAILCHIMP_API_KEY,
    listId: process.env.MAILCHIMP_LIST_ID
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    path: process.env.UPLOAD_PATH || './uploads'
  },

  rateLimit: {
    // Much higher limits for development
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000), // 15 min prod, 1 min dev
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || (process.env.NODE_ENV === 'production' ? 100 : 10000) // 100 prod, 10k dev
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },

  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://basecreative.com', 'https://app.basecreative.com']
      : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']
  }
};

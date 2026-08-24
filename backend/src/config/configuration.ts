export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGODB_URI || process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRATION || '7d',
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  cookie: {
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },
  googleSheet: {
    webAppUrl: process.env.GOOGLE_SHEET_WEBAPP_URL,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || '"Trường Thành Bookstore" <no-reply@truongthanh.vn>',
  },
});

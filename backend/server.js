const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet'); // درع الحماية
const { sequelize } = require('./config');
const { router } = require('./routes');
const { Admin } = require('./models');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// 🛡️ تفعيل Helmet لتأمين الـ HTTP Headers
app.use(helmet());

// إعدادات الحماية للسماح بتحميل الصور والملفات من نفس النطاق
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
    },
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إعداد الجلسات (Sessions)
app.use(session({
  secret: 'elite-clinic-super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true } // httpOnly يمنع سرقة الكوكيز بالـ JS
}));

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, '../public')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// مسارات الـ API
app.use('/', router);

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    
    const adminExists = await Admin.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await Admin.create({ username: 'admin', password: hashedPassword });
      console.log('✅ تم إنشاء حساب الأدمن الافتراضي');
    }

    app.listen(PORT, () => console.log(`🚀 الخادم يعمل على: http://localhost:${PORT}`));
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
  }
}

startServer();

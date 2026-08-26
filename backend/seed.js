const { sequelize } = require('./config');
const { Admin, Doctor, Booking } = require('./models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🔌 جاري الاتصال بقاعدة البيانات...');
    await sequelize.authenticate();

    // 1. مسح البيانات القديمة بالكامل (للبدء من جديد)
    console.log('🧹 جاري مسح البيانات القديمة...');
    await sequelize.sync({ force: true }); // force: true تمسح الجداول وتعيد إنشائها

    // 2. إنشاء حساب الأدمن
    console.log('👑 جاري إنشاء حساب الأدمن...');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    await Admin.create({ username: 'admin', password: hashedPassword });

    // 3. إضافة الأطباء التجريبيين
    console.log('👨‍⚕️ جاري إضافة الأطباء...');
    const doctors = await Doctor.bulkCreate([
      { name: 'د. سارة المطيري', specialty: 'استشارية جلدية', avatarColor: '#ffcb3c' },
      { name: 'د. خالد العتيبي', specialty: 'استشاري قلب', avatarColor: '#e8f0ff' },
      { name: 'د. نورة الحربي', specialty: 'استشارية أطفال', avatarColor: '#e6fbf5' },
      { name: 'د. فهد الشمري', specialty: 'استشاري أسنان', avatarColor: '#ffe9e5' },
      { name: 'د. عبدالله الزهراني', specialty: 'استشاري علاج طبيعي', avatarColor: '#33d0a8' }
    ]);

    // 4. إضافة حجوزات تجريبية للمرضى وربطها بالأطباء
    console.log('📅 جاري إضافة الحجوزات التجريبية...');
    await Booking.bulkCreate([
      { name: 'محمد العلي', phone: '0555555555', department: 'derma', doctorId: doctors[0].id, status: 'pending', bookingDay: 'الأحد', bookingTime: '09:00 ص' },
      { name: 'فاطمة أحمد', phone: '0566666666', department: 'heart', doctorId: doctors[1].id, status: 'confirmed', bookingDay: 'الإثنين', bookingTime: '11:30 ص' },
      { name: 'عبدالله سعد', phone: '0577777777', department: 'kids', doctorId: doctors[2].id, status: 'pending', bookingDay: 'الثلاثاء', bookingTime: '01:00 م' },
      { name: 'مها خالد', phone: '0588888888', department: 'dentist', doctorId: doctors[3].id, status: 'pending', bookingDay: 'الأربعاء', bookingTime: '04:00 م' },
      { name: 'زائر غير محدد الطبيب', phone: '0599999999', department: 'derma', doctorId: null, status: 'pending', bookingDay: 'الخميس', bookingTime: '06:00 م' }
    ]);

    console.log('\n========================================');
    console.log('✅ تم تجهيز البيانات التجريبية بنجاح!');
    console.log('👑 حساب الأدمن: admin / admin123');
    console.log('🚀 يمكنك الآن تشغيل السيرفر عبر: npm run dev');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ حدث خطأ أثناء تجهيز البيانات:', error);
  } finally {
    await sequelize.close(); // إغلاق الاتصال بعد الانتهاء
  }
};

seedDatabase();

const { Router } = require('express');
const { Booking, Doctor, Admin } = require('./models');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');

// 🛡️ حارس تسجيل الدخول: 5 محاولات فقط كل 15 دقيقة (يمنع تخمين كلمة المرور)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'محاولات كثيرة فاشلة. تم حظر مؤقت لمدة 15 دقيقة.' }
});

// 🛡️ حارس الحجوزات: 3 طلبات فقط في الساعة لكل مستخدم (يمنع إغراق الداتابيز بالسبام)
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'لقد وصلت للحد الأقصى من الحجوزات. حاول لاحقاً.' }
});


const router = Router();

// --- مسارات الموقع العام ---
// جلب قائمة الأطباء لعرضها في الموقع
router.get('/api/doctors', async (req, res) => {
  const doctors = await Doctor.findAll();
  res.json(doctors);
});


router.post('/api/bookings', bookingLimiter, async (req, res) => {
  try {
    // 1. تحديد قواعد التحقق (Schema)
    const bookingSchema = z.object({
      name: z.string().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
      phone: z.string().regex(/^05\d{8}$/, "رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام"),
      department: z.string().min(1, "يجب اختيار القسم"),
      doctorId: z.string().optional().or(z.number())
    });

    // 2. تطبيق التحقق على البيانات الواردة
    const validation = bookingSchema.safeParse(req.body);
    
    if (!validation.success) {
      // إذا كانت البيانات خاطئة، أرجع رسالة الخطأ للمستخدم
      return res.status(400).json({ 
        error: "بيانات غير صحيحة", 
        details: validation.error.issues[0].message 
      });
    }

    // 3. إذا كانت البيانات صحيحة، احفظها في الداتابيز
    const { name, phone, department, doctorId } = validation.data;
    const newBooking = await Booking.create({ name, phone, department, doctorId });
    
    res.status(201).json({ message: 'تم إنشاء الحجز بنجاح', booking: newBooking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في الخادم' });
  }
});

// --- مسارات لوحة التحكم (Admin) ---
router.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ where: { username } });
  
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  req.session.isAdmin = true;
  res.json({ message: 'تم تسجيل الدخول بنجاح' });
});

const authMiddleware = (req, res, next) => {
  if (req.session.isAdmin) return next();
  res.status(403).json({ error: 'غير مصرح لك بالدخول' });
};

router.get('/api/admin/stats', authMiddleware, async (req, res) => {
  const totalBookings = await Booking.count();
  const pendingBookings = await Booking.count({ where: { status: 'pending' } });
  const totalDoctors = await Doctor.count();
  res.json({ totalBookings, pendingBookings, totalDoctors });
});

router.get('/api/admin/bookings', authMiddleware, async (req, res) => {
  const bookings = await Booking.findAll({ include: [Doctor], order: [['createdAt', 'DESC']] });
  res.json(bookings);
});

router.put('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  await Booking.update({ status }, { where: { id: req.params.id } });
  res.json({ message: 'تم التحديث' });
});

router.get('/api/admin/doctors', authMiddleware, async (req, res) => {
  const doctors = await Doctor.findAll();
  res.json(doctors);
});

router.post('/api/admin/doctors', authMiddleware, async (req, res) => {
  const { name, specialty } = req.body;
  const doctor = await Doctor.create({ name, specialty });
  res.status(201).json(doctor);
});

// مسار حذف حجز
router.delete('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  try {
    await Booking.destroy({ where: { id: req.params.id } });
    res.json({ message: 'تم حذف الحجز بنجاح' });
  } catch (error) {
    res.status(500).json({ error: 'حدث خطأ أثناء الحذف' });
  }
});

module.exports = { router };

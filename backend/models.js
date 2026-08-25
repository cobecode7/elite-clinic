const { DataTypes } = require('sequelize');
const { sequelize } = require('./config');

const Booking = sequelize.define('Booking', {
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' }
}, { tableName: 'bookings', timestamps: true });

const Doctor = sequelize.define('Doctor', {
  name: { type: DataTypes.STRING, allowNull: false },
  specialty: { type: DataTypes.STRING, allowNull: false },
  avatarColor: { type: DataTypes.STRING, defaultValue: '#ffcb3c' }
}, { tableName: 'doctors', timestamps: true });

// نموذج مدير النظام (Admin)
const Admin = sequelize.define('Admin', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false } // كلمة المرور مشفرة
}, { tableName: 'admins', timestamps: true });

// العلاقات
Doctor.hasMany(Booking, { foreignKey: 'doctorId', allowNull: true });
Booking.belongsTo(Doctor, { foreignKey: 'doctorId', allowNull: true });

module.exports = { Booking, Doctor, Admin };

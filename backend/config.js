const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'elite_clinic',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: isProduction ? 'postgres' : 'sqlite',
    storage: isProduction ? undefined : './database.sqlite', // ملف قاعدة البيانات المحلية
    logging: false,
  }
);

module.exports = { sequelize };

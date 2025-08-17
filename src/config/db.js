import 'dotenv/config.js';
import { Sequelize } from 'sequelize';

const {
  DB_HOST, DB_PORT = 3306, DB_NAME, DB_USER, DB_PASS
} = process.env;

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: Number(DB_PORT),
  dialect: 'mysql',
  logging: false, // set true for SQL logs
  define: {
    underscored: true,
    freezeTableName: true
  },
  dialectOptions: {
    // ssl: { rejectUnauthorized: true } // enable if your MySQL requires SSL
  }
});

export async function connectAndSync() {
  await sequelize.authenticate();
  // In prod, use migrations. For demo, sync schema automatically:
  await sequelize.sync({ alter: false }); // change to true during dev to evolve schema
}

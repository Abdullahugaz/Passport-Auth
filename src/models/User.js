import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db.js';
import bcrypt from 'bcrypt';

class User extends Model {
  async setPassword(plain) {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(plain, saltRounds);
  }
  validatePassword(plain) {
    return bcrypt.compare(plain, this.passwordHash);
  }
  toSafeJSON() {
    const { id, email, name, createdAt, updatedAt } = this.get();
    return { id, email, name, createdAt, updatedAt };
  }
}

User.init(
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(191), unique: true, allowNull: false, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(100), allowNull: false },
    name: { type: DataTypes.STRING(100) }
  },
  { sequelize, modelName: 'user', tableName: 'users' }
);

export default User;

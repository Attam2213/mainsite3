import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Setting extends Model {
  public key!: string;
  public value!: unknown;
}

Setting.init({
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Setting',
});

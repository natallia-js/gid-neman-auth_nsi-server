const { DataTypes, Model } = require('sequelize');
const { TDNCSector } = require('./TDNCSector');

const MODEL_NAME = 'TDNCSectorWorkPoligon';

class TDNCSectorWorkPoligon extends Model {}

// Схема таблицы рабочих полигонов типа "участок ДНЦ"
function createDNCSectorWorkPoligonModel(sequelize) {
  TDNCSectorWorkPoligon.init({
    // id пользователя
    DNCSWP_UserID: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    // id участка ДНЦ
    DNCSWP_DNCSID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TDNCSector,
        key: 'DNCS_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createDNCSectorWorkPoligonModel,
  TDNCSectorWorkPoligon,
};

const { DataTypes, Model } = require('sequelize');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TECDSectorWorkPoligon';

class TECDSectorWorkPoligon extends Model {}

// Схема таблицы рабочих полигонов типа "участок ЭЦД"
function createECDSectorWorkPoligonModel(sequelize) {
  TECDSectorWorkPoligon.init({
    // id пользователя
    ECDSWP_UserID: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    // id участка ЭЦД
    ECDSWP_ECDSID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TECDSector,
        key: 'ECDS_ID',
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
  createECDSectorWorkPoligonModel,
  TECDSectorWorkPoligon,
};

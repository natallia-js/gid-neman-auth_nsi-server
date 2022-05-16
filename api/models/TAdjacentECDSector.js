const { DataTypes, Model } = require('sequelize');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TAdjacentECDSector';

class TAdjacentECDSector extends Model {}

const TAdjacentECDSectorFields = {
  AECDS_ECDSectorID1: 'AECDS_ECDSectorID1',
  AECDS_ECDSectorID2: 'AECDS_ECDSectorID2',
};

// Схема таблицы смежных участков ЭЦД
function createAdjacentECDSectorModel(sequelize) {
  TAdjacentECDSector.init({
    // id одного участка ЭЦД
    [TAdjacentECDSectorFields.AECDS_ECDSectorID1]: {
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
    // id другого участка ЭЦД
    [TAdjacentECDSectorFields.AECDS_ECDSectorID2]: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TECDSector,
        key: 'ECDS_ID'
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
  createAdjacentECDSectorModel,
  TAdjacentECDSectorFields,
  TAdjacentECDSector
};

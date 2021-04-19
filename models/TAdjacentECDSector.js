const { DataTypes, Model } = require('sequelize');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TAdjacentECDSector';

class TAdjacentECDSector extends Model {}

function createAdjacentECDSectorModel(sequelize) {
  TAdjacentECDSector.init({
    AECDS_ECDSectorID1: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: TECDSector,
        key: 'ECDS_ID'
      },
    },
    AECDS_ECDSectorID2: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: TECDSector,
        key: 'ECDS_ID'
      },
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
  TAdjacentECDSector
};

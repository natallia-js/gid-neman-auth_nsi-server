const { DataTypes, Model } = require('sequelize');
const { TDNCSector } = require('./TDNCSector');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TNearestDNCandECDSector';

class TNearestDNCandECDSector extends Model {}

function createNearestDNCandECDSectorModel(sequelize) {
  TNearestDNCandECDSector.init({
    NDE_ECDSectorID: {
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
    NDE_DNCSectorID: {
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
  createNearestDNCandECDSectorModel,
  TNearestDNCandECDSector
};

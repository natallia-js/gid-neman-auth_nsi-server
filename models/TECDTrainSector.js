const { DataTypes, Model } = require('sequelize');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TECDTrainSector';
const UNIQUE_ECDTRAINSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueECDTrainSectorTitle';

class TECDTrainSector extends Model {}

function createECDTrainSectorModel(sequelize) {
  TECDTrainSector.init({
    ECDTS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ECDTS_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: UNIQUE_ECDTRAINSECTOR_TITLE_CONSTRAINT_NAME,
    },
    ECDTS_ECDSectorID: {
      type: DataTypes.INTEGER,
      references: {
        model: TECDSector,
        key: 'ECDS_ID'
      },
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createECDTrainSectorModel,
  TECDTrainSector
};

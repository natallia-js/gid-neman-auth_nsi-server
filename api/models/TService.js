const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TService';
const UNIQUE_SERVICE_ABBREV_CONSTRAINT_NAME = 'XUniqueServiceAbbrev';

class TService extends Model {}

function createServiceModel(sequelize) {
  TService.init({
    S_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    S_Abbrev: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: UNIQUE_SERVICE_ABBREV_CONSTRAINT_NAME,
    },
    S_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createServiceModel,
  TService,
};

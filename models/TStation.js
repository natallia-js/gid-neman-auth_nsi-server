const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TStation';
const UNIQUE_STATION_UNMC_CONSTRAINT_NAME = 'XUniqueStationUNMC';

class TStation extends Model {}

function createStationModel(sequelize) {
  TStation.init({
    St_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    St_UNMC: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: UNIQUE_STATION_UNMC_CONSTRAINT_NAME,
    },
    St_Title: {
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
  createStationModel,
  TStation,
};

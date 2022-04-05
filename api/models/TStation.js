const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TStation';
const UNIQUE_STATION_UNMC_CONSTRAINT_NAME = 'XUniqueStationUNMC';

class TStation extends Model {}

// Схема таблицы станций
function createStationModel(sequelize) {
  TStation.init({
    // id станции
    St_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // ЕСР-код станции
    St_UNMC: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: UNIQUE_STATION_UNMC_CONSTRAINT_NAME,
    },
    // название станции
    St_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    // id станции в ПЭНСИ
    St_PENSI_ID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // ЕСР-код станции в ПЭНСИ
    St_PENSI_UNMC: {
      type: DataTypes.STRING(6),
      allowNull: true,
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

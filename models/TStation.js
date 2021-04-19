const { DataTypes, Model } = require('sequelize');
const { TDNCTrainSector } = require('./TDNCTrainSector');
const { TECDTrainSector } = require('./TECDTrainSector');

const MODEL_NAME = 'TStation';
const UNIQUE_STATION_UNMC_CONSTRAINT_NAME = 'XUniqueStationUNMC';

class TStation extends Model {}

function createStationModel(sequelize) {
  TStation.init({
    St_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
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
    St_ECDTrainSectorID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TECDTrainSector,
        key: 'ECDTS_ID'
      },
    },
    St_DNCTrainSectorID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TDNCTrainSector,
        key: 'DNCTS_ID'
      },
    },
    St_ECDTrainSectorPosition: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    St_DNCTrainSectorPosition: {
      type: DataTypes.TINYINT,
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
  TStation
};

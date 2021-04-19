const { DataTypes, Model } = require('sequelize');
const { TStation } = require('./TStation');
const { TDNCTrainSector } = require('./TDNCTrainSector');
const { TECDTrainSector } = require('./TECDTrainSector');

const MODEL_NAME = 'TBlock';
const UNIQUE_BLOCK_TITLE_CONSTRAINT_NAME = 'XUniqueBlockTitle';
const UNIQUE_BLOCK_STATIONS_CONSTRAINT_NAME = 'XUniqueBlockStations';

class TBlock extends Model {}

function createBlockModel(sequelize) {
  TBlock.init({
    Bl_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    Bl_Title: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: UNIQUE_BLOCK_TITLE_CONSTRAINT_NAME,
    },
    Bl_StationID1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: UNIQUE_BLOCK_STATIONS_CONSTRAINT_NAME,
      references: {
        model: TStation,
        key: 'St_ID'
      },
    },
    Bl_StationID2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: UNIQUE_BLOCK_STATIONS_CONSTRAINT_NAME,
      references: {
        model: TStation,
        key: 'St_ID'
      },
    },
    Bl_ECDTrainSectorID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TECDTrainSector,
        key: 'ECDTS_ID'
      },
    },
    Bl_DNCTrainSectorID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: TDNCTrainSector,
        key: 'DNCTS_ID'
      },
    },
    Bl_DNCTrainSectorPosition: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    Bl_ECDTrainSectorPosition: {
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
  createBlockModel,
  TBlock
};

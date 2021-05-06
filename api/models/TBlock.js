const { DataTypes, Model } = require('sequelize');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TBlock';
const UNIQUE_BLOCK_TITLE_CONSTRAINT_NAME = 'XUniqueBlockTitle';
const UNIQUE_BLOCK_STATIONS_CONSTRAINT_NAME = 'XUniqueBlockStations';

class TBlock extends Model {}

function createBlockModel(sequelize) {
  TBlock.init({
    Bl_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
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
    },
    Bl_StationID2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: UNIQUE_BLOCK_STATIONS_CONSTRAINT_NAME,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TStation.hasMany(TBlock, {
    foreignKey: 'Bl_StationID1',
    sourceKey: 'St_ID',
  });
  TStation.hasMany(TBlock, {
    foreignKey: 'Bl_StationID2',
    sourceKey: 'St_ID',
  });
  TBlock.belongsTo(TStation, {
    as: 'station1',
    foreignKey: 'Bl_StationID1',
    targetKey: 'St_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
  TBlock.belongsTo(TStation, {
    as: 'station2',
    foreignKey: 'Bl_StationID2',
    targetKey: 'St_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createBlockModel,
  TBlock,
};

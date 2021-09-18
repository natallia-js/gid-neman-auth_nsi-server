const { DataTypes, Model } = require('sequelize');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TStationTrack';

class TStationTrack extends Model {}

// Схема таблицы станционных путей
function createStationTrackModel(sequelize) {
  TStationTrack.init({
    // id пути станции
    ST_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование пути
    ST_Name: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    // id станции
    ST_StationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TStation.hasMany(TStationTrack, {
    foreignKey: 'ST_StationId',
    sourceKey: 'St_ID',
  });
  TStationTrack.belongsTo(TStation, {
    as: 'tracks',
    foreignKey: 'ST_StationId',
    targetKey: 'St_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createStationTrackModel,
  TStationTrack,
};

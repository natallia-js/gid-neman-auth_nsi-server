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
    ST_SuburbanReception: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_PassengerReception: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_CargoReception: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_SuburbanDeparture: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_PassengerDeparture: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_CargoDeparture: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_SuburbanPass: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_PassengerPass: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_CargoPass: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_SpecialTrainReception: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_SpecialTrainDeparture: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
    },
    ST_SpecialTrainPass: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
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

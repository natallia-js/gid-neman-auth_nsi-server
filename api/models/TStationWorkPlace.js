const { DataTypes, Model } = require('sequelize');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TStationWorkPlace';

class TStationWorkPlace extends Model {}

// Схема таблицы рабочих мест на станции
function createStationWorkPlaceModel(sequelize) {
  TStationWorkPlace.init({
    // id рабочего места
    SWP_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование рабочего места
    SWP_Name: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    // id станции
    SWP_StationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TStation.hasMany(TStationWorkPlace, {
    foreignKey: 'SWP_StationId',
    sourceKey: 'St_ID',
  });
  TStationWorkPlace.belongsTo(TStation, {
    as: 'workPlaces',
    foreignKey: 'SWP_StationId',
    targetKey: 'St_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createStationWorkPlaceModel,
  TStationWorkPlace,
};

const { DataTypes, Model } = require('sequelize');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TStationWorkPoligon';
const UNIQUE_STATION_WORK_POLIGON_CONSTRAINT_NAME = 'XUniqueStationWorkPoligon';

class TStationWorkPoligon extends Model {}

// Схема таблицы рабочих полигонов типа "станция" и "рабочее место на станции"
function createStationWorkPoligonModel(sequelize) {
  TStationWorkPoligon.init({
    SWP_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // id пользователя
    SWP_UserID: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_STATION_WORK_POLIGON_CONSTRAINT_NAME,
    },
    // id станции (если задано только это поле и не указан id рабочего места, то полагается,
    // что это рабочее место ДСП)
    SWP_StID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_STATION_WORK_POLIGON_CONSTRAINT_NAME,
      references: {
        model: TStation,
        key: 'St_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
    // id рабочего места на станции
    SWP_StWP_ID: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: UNIQUE_STATION_WORK_POLIGON_CONSTRAINT_NAME,
      /* Этот код нужен, но при его добавлении почему-то возникает ошибка
      Server Error Cannot read property 'getQueryInterface' of undefined */
      /* references: {
        model: TStationWorkPlace,
        key: 'SWP_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',*/
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createStationWorkPoligonModel,
  TStationWorkPoligon,
};

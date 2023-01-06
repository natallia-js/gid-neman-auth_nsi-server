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
    // ЕСР-код ГИД станции
    St_GID_UNMC: {
      type: DataTypes.STRING(6),
      allowNull: false,
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
    // Дата-время последнего изменения в информации о персонале станции.
    // Данное поле нужно исключительно для обновления информации о персонале в ГИД ДНЦ (в его локальной БД).
    // Учитывается обновление только следующего рода информации: ФИО, должность.
    St_LastPersonalUpdateTime: {
      type: DataTypes.DATE,
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

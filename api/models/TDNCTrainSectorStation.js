const { DataTypes, Model } = require('sequelize');
const { TDNCTrainSector } = require('./TDNCTrainSector');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TDNCTrainSectorStation';
const UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR = 'XUniqueStationPositionInDNCTrainSector';

class TDNCTrainSectorStation extends Model {}

// Схема таблицы станций поездных участков ДНЦ
function createDNCTrainSectorStationModel(sequelize) {
  TDNCTrainSectorStation.init({
    // id поездного участка ДНЦ
    DNCTSS_TrainSectorID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR,
    },
    // id станции
    DNCTSS_StationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    // позиция станции на поездном участке
    DNCTSS_StationPositionInTrainSector: {
      type: DataTypes.TINYINT,
      allowNull: false,
      unique: UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR,
    },
    // принадлежность станции участку ДНЦ
    DNCTSS_StationBelongsToDNCSector: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  /* Данные строки с belongsToMany определяют связь между таблицами TStations и TDNCTrainSectors
  через таблицу (промежуточная таблица) TDNCTrainSectorStations */
  TDNCTrainSector.belongsToMany(TStation, {
    through: TDNCTrainSectorStation,
    unique: false,
    foreignKey: 'DNCTSS_TrainSectorID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
  TStation.belongsToMany(TDNCTrainSector, {
    through: TDNCTrainSectorStation,
    unique: false,
    foreignKey: 'DNCTSS_StationID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createDNCTrainSectorStationModel,
  TDNCTrainSectorStation,
};

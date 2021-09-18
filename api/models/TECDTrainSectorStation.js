const { DataTypes, Model } = require('sequelize');
const { TECDTrainSector } = require('./TECDTrainSector');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TECDTrainSectorStation';
const UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR = 'XUniqueStationPositionInECDTrainSector';

class TECDTrainSectorStation extends Model {}

// Схема таблицы станций поездных участков ЭЦД
function createECDTrainSectorStationModel(sequelize) {
  TECDTrainSectorStation.init({
    // id поездного участка ЭЦД
    ECDTSS_TrainSectorID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR,
    },
    // id станции
    ECDTSS_StationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    // позиция станции на поездном участке
    ECDTSS_StationPositionInTrainSector: {
      type: DataTypes.TINYINT,
      allowNull: false,
      unique: UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR,
    },
    // принадлежность станции участку ЭЦД
    ECDTSS_StationBelongsToECDSector: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TECDTrainSector.belongsToMany(TStation, {
    through: TECDTrainSectorStation,
    unique: false,
    foreignKey: 'ECDTSS_TrainSectorID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
  TStation.belongsToMany(TECDTrainSector, {
    through: TECDTrainSectorStation,
    unique: false,
    foreignKey: 'ECDTSS_StationID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createECDTrainSectorStationModel,
  TECDTrainSectorStation,
};

const { DataTypes, Model } = require('sequelize');
const { TDNCTrainSector } = require('./TDNCTrainSector');
const { TStation } = require('./TStation');

const MODEL_NAME = 'TDNCTrainSectorStation';
const UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR = 'XUniqueStationPositionInDNCTrainSector';

class TDNCTrainSectorStation extends Model {}

function createDNCTrainSectorStationModel(sequelize) {
  TDNCTrainSectorStation.init({
    DNCTSS_TrainSectorID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR,
    },
    DNCTSS_StationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    DNCTSS_StationPositionInTrainSector: {
      type: DataTypes.TINYINT,
      allowNull: false,
      unique: UNIQUE_STATION_POSITION_IN_TRAIN_SECTOR,
    },
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

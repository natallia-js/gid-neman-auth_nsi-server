const { DataTypes, Model } = require('sequelize');
const { TDNCTrainSector } = require('./TDNCTrainSector');
const { TBlock } = require('./TBlock');

const MODEL_NAME = 'TDNCTrainSectorBlock';
const UNIQUE_BLOCK_POSITION_IN_TRAIN_SECTOR = 'XUniqueBlockPositionInDNCTrainSector';

class TDNCTrainSectorBlock extends Model {}

// Схема таблицы перегонов поездных участков ДНЦ
function createDNCTrainSectorBlockModel(sequelize) {
  TDNCTrainSectorBlock.init({
    // id поездного участка ДНЦ
    DNCTSB_TrainSectorID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_BLOCK_POSITION_IN_TRAIN_SECTOR,
    },
    // id перегона
    DNCTSB_BlockID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    // позиция перегона на поездном участке
    DNCTSB_BlockPositionInTrainSector: {
      type: DataTypes.TINYINT,
      allowNull: false,
      unique: UNIQUE_BLOCK_POSITION_IN_TRAIN_SECTOR,
    },
    // принадлежность перегона участку ДНЦ
    DNCTSB_BlockBelongsToDNCSector: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TDNCTrainSector.belongsToMany(TBlock, {
    through: TDNCTrainSectorBlock,
    unique: false,
    foreignKey: 'DNCTSB_TrainSectorID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
  TBlock.belongsToMany(TDNCTrainSector, {
    through: TDNCTrainSectorBlock,
    unique: false,
    foreignKey: 'DNCTSB_BlockID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createDNCTrainSectorBlockModel,
  TDNCTrainSectorBlock,
};

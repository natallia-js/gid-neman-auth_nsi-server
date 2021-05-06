const { DataTypes, Model } = require('sequelize');
const { TECDTrainSector } = require('./TECDTrainSector');
const { TBlock } = require('./TBlock');

const MODEL_NAME = 'TECDTrainSectorBlock';
const UNIQUE_BLOCK_POSITION_IN_TRAIN_SECTOR = 'XUniqueBlockPositionInECDTrainSector';

class TECDTrainSectorBlock extends Model {}

function createECDTrainSectorBlockModel(sequelize) {
  TECDTrainSectorBlock.init({
    ECDTSB_TrainSectorID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: UNIQUE_BLOCK_POSITION_IN_TRAIN_SECTOR,
    },
    ECDTSB_BlockID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    ECDTSB_BlockPositionInTrainSector: {
      type: DataTypes.TINYINT,
      allowNull: false,
      unique: UNIQUE_BLOCK_POSITION_IN_TRAIN_SECTOR,
    },
    ECDTSB_BlockBelongsToECDSector: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TECDTrainSector.belongsToMany(TBlock, {
    through: TECDTrainSectorBlock,
    unique: false,
    foreignKey: 'ECDTSB_TrainSectorID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
  TBlock.belongsToMany(TECDTrainSector, {
    through: TECDTrainSectorBlock,
    unique: false,
    foreignKey: 'ECDTSB_BlockID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createECDTrainSectorBlockModel,
  TECDTrainSectorBlock,
};

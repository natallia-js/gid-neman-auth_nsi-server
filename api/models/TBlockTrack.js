const { DataTypes, Model } = require('sequelize');
const { TBlock } = require('./TBlock');

const MODEL_NAME = 'TBlockTrack';

class TBlockTrack extends Model {}

// Схема таблицы путей перегонов
function createBlockTrackModel(sequelize) {
  TBlockTrack.init({
    // id пути
    BT_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // название пути
    BT_Name: {
      type: DataTypes.STRING(16),
      allowNull: false,
    },
    // id перегона
    BT_BlockId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TBlock.hasMany(TBlockTrack, {
    foreignKey: 'BT_BlockId',
    sourceKey: 'Bl_ID',
  });
  TBlockTrack.belongsTo(TBlock, {
    as: 'tracks',
    foreignKey: 'BT_BlockId',
    targetKey: 'Bl_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createBlockTrackModel,
  TBlockTrack,
};

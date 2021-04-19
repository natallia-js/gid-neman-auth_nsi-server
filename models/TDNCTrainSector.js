const { DataTypes, Model } = require('sequelize');
const { TDNCSector } = require('./TDNCSector');

const MODEL_NAME = 'TDNCTrainSector';
const UNIQUE_DNCTRAINSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueDNCTrainSectorTitle';

class TDNCTrainSector extends Model {}

function createDNCTrainSectorModel(sequelize) {
  TDNCTrainSector.init({
    DNCTS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    DNCTS_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: UNIQUE_DNCTRAINSECTOR_TITLE_CONSTRAINT_NAME,
    },
    DNCTS_DNCSectorID: {
      type: DataTypes.INTEGER,
      references: {
        model: TDNCSector,
        key: 'DNCS_ID'
      },
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createDNCTrainSectorModel,
  TDNCTrainSector
};

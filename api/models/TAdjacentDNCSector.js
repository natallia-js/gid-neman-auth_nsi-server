const { DataTypes, Model } = require('sequelize');
const { TDNCSector } = require('./TDNCSector');

const MODEL_NAME = 'TAdjacentDNCSector';

class TAdjacentDNCSector extends Model {}

function createAdjacentDNCSectorModel(sequelize) {
  TAdjacentDNCSector.init({
    ADNCS_DNCSectorID1: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TDNCSector,
        key: 'DNCS_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
    ADNCS_DNCSectorID2: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: TDNCSector,
        key: 'DNCS_ID',
      },
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createAdjacentDNCSectorModel,
  TAdjacentDNCSector,
};

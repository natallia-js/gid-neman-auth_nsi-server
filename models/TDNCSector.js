const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TDNCSector';
const UNIQUE_DNCSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueDNCSectorTitle';

class TDNCSector extends Model {}

function createDNCSectorModel(sequelize) {
  TDNCSector.init({
    DNCS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    DNCS_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: UNIQUE_DNCSECTOR_TITLE_CONSTRAINT_NAME,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createDNCSectorModel,
  TDNCSector
};

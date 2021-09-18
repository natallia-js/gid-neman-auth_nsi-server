const { DataTypes, Model } = require('sequelize');

const MODEL_NAME = 'TECDSector';
const UNIQUE_ECDSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueECDSectorTitle';

class TECDSector extends Model {}

// Схема таблицы участков ЭЦД
function createECDSectorModel(sequelize) {
  TECDSector.init({
    // id участка ЭЦД
    ECDS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование участка ЭЦД
    ECDS_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: UNIQUE_ECDSECTOR_TITLE_CONSTRAINT_NAME,
    },
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });
}

module.exports = {
  createECDSectorModel,
  TECDSector
};

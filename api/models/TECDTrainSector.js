const { DataTypes, Model } = require('sequelize');
const { TECDSector } = require('./TECDSector');

const MODEL_NAME = 'TECDTrainSector';
const UNIQUE_ECDTRAINSECTOR_TITLE_CONSTRAINT_NAME = 'XUniqueECDTrainSectorTitle';

class TECDTrainSector extends Model {}

// Схема таблицы поездных участков ЭЦД
function createECDTrainSectorModel(sequelize) {
  TECDTrainSector.init({
    // id поездного участка ЭЦД
    ECDTS_ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    // наименование поездного участка
    ECDTS_Title: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: UNIQUE_ECDTRAINSECTOR_TITLE_CONSTRAINT_NAME,
    },
    // id участка ЭЦД
    ECDTS_ECDSectorID: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  }, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    timestamps: true, // Create createdAt and updatedAt
    modelName: MODEL_NAME, // We need to choose the model name
  });

  TECDSector.hasMany(TECDTrainSector, {
    foreignKey: 'ECDTS_ECDSectorID',
    sourceKey: 'ECDS_ID',
  });
  TECDTrainSector.belongsTo(TECDSector, {
    foreignKey: 'ECDTS_ECDSectorID',
    targetKey: 'ECDS_ID',
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  });
}

module.exports = {
  createECDTrainSectorModel,
  TECDTrainSector,
};
